package routes

import (
	. "context"
	"errors"
	"fmt"
	"io/fs"
	netHTTP "net/http"
	"os"
	"path"
	"strings"

	"sr/config"
	"sr/errs"
	srHTTP "sr/http"
	"sr/log"
	"sr/taskCtx"

	"go.opentelemetry.io/otel/trace"
)

// Serve static files according to webpack's convention.

const hashLength = 8

var validStaticSubdirs = []string{"media", "js", "css"}

func logServedContent(response srHTTP.Response, request srHTTP.Request, fileName string, zipped bool) {
	dur := taskCtx.FormatDuration(request.Context())
	msg := "zipped"
	if !zipped {
		msg = "unzipped"
	}
	log.CallerStdout(request.Context(), fmt.Sprintf("*> Served %v %v (%v)", fileName, msg, dur))
}

var frontendRouter = makeFrontendRouter()

func stringArrayContains(array []string, val string) bool {
	for _, inArray := range array {
		if inArray == val {
			return true
		}
	}
	return false
}

func invalidPath(path string) bool {
	trimmed := strings.Trim(path, "/")
	return trimmed == "." || !fs.ValidPath(trimmed)
}

func etagForFile(ctx Context, subFolder string, fileName string) string {
	ext := path.Ext(fileName) // the .map files have the same hash as the originals
	switch subFolder {
	case "css":
		var lastDot int
		// {main|i}.hash.chunk.css[.map]
		if strings.HasSuffix(fileName, ".map") {
			lastDot = len(fileName) - len(".chunk.css.map")
		} else if strings.HasSuffix(fileName, ".css") {
			lastDot = len(fileName) - len(".chunk.css")
		} else {
			return ""
		}
		// expecting len("main.") or len("i.") leftover
		if len(fileName)-lastDot < 2 {
			return ""
		}
		return fileName[lastDot-hashLength:lastDot] + ext // map has same name in etag
	case "media":
		lastDot := strings.LastIndex(fileName, ".")
		// expect at least an original file with a name like f.js
		if lastDot == -1 || len(fileName) < lastDot-hashLength-3 {
			return ""
		}
		return fileName[lastDot-hashLength : lastDot]
	case "js":
		var offset int
		if strings.HasPrefix(fileName, "runtime-main.") {
			offset = len("runtime-main.")
		} else if strings.HasPrefix(fileName, "main.") {
			offset = len("main.")
		} else {
			offset = strings.Index(fileName, ".") + 1
		}
		if offset == -1 || len(fileName) < offset+hashLength+3 {
			return ""
		}
		return fileName[offset:offset+hashLength] + ext
	default:
		err := fmt.Errorf("Unknown subfolder %v", subFolder)
		log.Printf(ctx, err.Error())
		span := trace.SpanFromContext(ctx)
		span.RecordError(err)
		return ""
	}
}

func closeFile(ctx Context, file *os.File, path string) {
	if err := file.Close(); err != nil {
		log.Printf(ctx, "Error closing file %v: %v", path, err)
	}
}

func openFrontendFile(ctx Context, filePath string, useZipped bool, useDefault bool) (*os.File, bool, bool, error) {
	var file *os.File
	var err error
	var storagePath string
	// Try to open <file>.gz
	if useZipped {
		storagePath = path.Join(config.FrontendBasePath, filePath+".gz")
		log.Printf(ctx, "Zipped exact %s", storagePath)
		file, err := os.Open(storagePath)
		if err == nil {
			return file, true, false, nil
		}
	}
	// Either not found, or can't use compressed
	// Try to open <file>
	storagePath = path.Join(config.FrontendBasePath, filePath)
	log.Printf(ctx, "Unzipped exact %s", storagePath)
	file, err = os.Open(storagePath)
	if err == nil {
		return file, false, false, nil
	}
	// Stop checking here for /static/invalidfile, otherwise default to /index.html
	if !useDefault {
		return nil, false, false, fmt.Errorf("unable to open %v: %v", filePath, err)
	}
	if useZipped {
		// Try to open index.html.gz
		storagePath = path.Join(config.FrontendBasePath, "index.html.gz")
		log.Printf(ctx, "Zipped index %s", storagePath)
		file, err = os.Open(storagePath)
		if err == nil {
			return file, true, true, nil
		}
		// allow for not found but if we asked for zipping and didn't zip index.html something's up
		log.Printf(ctx, "Warning: Error opening /index.html.gz with zipping: %v", err)
	}
	// ignore not found, could still be a name issue
	// Try to open index.html
	storagePath = path.Join(config.FrontendBasePath, "index.html")
	log.Printf(ctx, "Unzipped index %s", storagePath)
	file, err = os.Open(path.Join(config.FrontendBasePath, "index.html"))
	if err == nil {
		return file, false, true, nil
	}
	if !errors.Is(err, os.ErrNotExist) {
		return nil, false, true, fmt.Errorf("opening defaulted /index: %w", err)
	}
	// index.html not found
	return nil, false, true, fmt.Errorf("got not found for /index: %w", err)
}

//
// /static/subdir/file.hash.ext
//

// Part of makeFrontendRouter
//var _ = frontendRouter.PathPrefix("/static").HandlerFunc(handleFrontendStatic)

func handleFrontendStatic(response srHTTP.Response, request srHTTP.Request) {
	logFrontendRequest(request)
	ctx := request.Context()
	requestPath := request.URL.Path
	requestDir, requestFile := path.Split(requestPath)
	fetchGzipped := config.FrontendGzipped && strings.Contains(request.Header.Get("Accept-Encoding"), "gzip")

	if invalidPath(requestPath) || strings.Count(requestDir, "/") != 3 {
		log.Printf(ctx, "Path was invalid")
		srHTTP.Halt(ctx, errs.BadRequestf("bad path '%v'", requestPath))
	}
	subDir := requestDir[len("static/") : len(requestDir)-1]
	if !stringArrayContains(validStaticSubdirs, subDir[1:]) {
		log.Printf(ctx, "Invalid subdir %v", subDir)
		srHTTP.Halt(ctx, errs.NotFoundf(subDir))
	}

	// This data is seriously cacheable
	response.Header().Set("Cache-Control", "max-age=31536000, public, immutable")

	etag := etagForFile(ctx, subDir[1:], requestFile)
	if etag != "" {
		response.Header().Add("Etag", etag)
		log.Printf(ctx, "Added etag %v", etag)
	} else {
		log.Printf(ctx, "Unable to add etag for %v", requestFile)
	}

	file, zipped, _, err := openFrontendFile(ctx, requestPath, fetchGzipped, false)
	srHTTP.HaltInternal(ctx, err)
	defer closeFile(ctx, file, requestPath)

	info, err := file.Stat()
	srHTTP.HaltInternal(ctx, err)

	response.Header().Add("Vary", "Accept-Encoding")
	if zipped {
		response.Header().Add("Content-Encoding", "gzip")
	}

	if strings.HasSuffix(requestFile, ".map") {
		response.Header().Set("Content-Type", "application/json")
	}

	// calls checkIfMatch(), which looks at modtime/If-Unmodified-Since and Etag/If-None-Match header.
	// we've already set the Etag, so if the client's already seen this, we can skip actually reading the file.
	netHTTP.ServeContent(response, request, requestFile, info.ModTime(), file)
	logServedContent(response, request, requestFile, zipped)
}

// Part of makeFrontendRouter
//var _ = frontendRouter.NewRoute().HandlerFunc(handleFrontendBase)

// /path
func handleFrontendBase(response srHTTP.Response, request srHTTP.Request) {
	ctx := request.Context()
	logFrontendRequest(request)
	requestPath := request.URL.Path
	requestDir, requestFile := path.Split(requestPath)
	fetchGzipped := config.FrontendGzipped && strings.Contains(request.Header.Get("Accept-Encoding"), "gzip")

	resetPath := func() {
		requestDir = "/"
		requestFile = "index.html"
		requestPath = "/index.html"
	}

	if requestDir == "/" && requestFile == "" {
		log.Printf(ctx, "It's a request to /, serve index.html")
		resetPath()
	}

	// If it's a subdir that's not /static, we know without checking that file doesn't exist
	// This should be the case with most SPA paths, i.e. /join/<gameID> but not /about.
	if strings.Count(requestDir, "/") != 1 {
		log.Printf(ctx, "It's a subpath, definitely going to need /index.html instead")
		resetPath()
	}

	// We shouldn't set a max-age cache header, we should rely on if-not-modified (and also just set up PWA stuff).
	// response.Header.Set("Cache-Control", "max-age=86400")
	file, zipped, defaulted, err := openFrontendFile(ctx, requestPath, fetchGzipped, true)
	if defaulted {
		log.Printf(ctx, "Exact file not found, used /index.html")
		resetPath()
	}
	srHTTP.HaltInternal(ctx, err)
	defer closeFile(ctx, file, requestPath)

	info, err := file.Stat()
	srHTTP.HaltInternal(ctx, err)

	response.Header().Add("Vary", "Accept-Encoding")
	if zipped {
		response.Header().Add("Content-Encoding", "gzip")
	}

	// Serve the content in the file, sending the original MIME type (based on file name)
	// calls checkIfMatch(), which only checks modtime since we don't add cache information.
	netHTTP.ServeContent(response, request, requestFile, info.ModTime(), file)
	logServedContent(response, request, requestFile, zipped)
}
