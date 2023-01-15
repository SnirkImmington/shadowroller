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
	"time"

	"sr/config"
	"sr/errs"
	srHTTP "sr/http"
	"sr/log"
	srOtel "sr/otel"
	"sr/taskCtx"

	attr "go.opentelemetry.io/otel/attribute"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

// Serve static files according to webpack's convention.

// hashLength is the length of the hash included in the filenames of static
// assets generated by Webpack
const hashLength = 8

// validStaticSubdirs are the (known) subdirs generated by Webpack with the
// create-react-app configuration.
var validStaticSubdirs = []string{"media", "js", "css"}

// logServedContent logs an event and prints to the console when the given HTTP
// response is served, in a style similar to the way backend routers do.
func logServedContent(response srHTTP.Response, request srHTTP.Request, fileName string, zipped bool) {
	ctx := request.Context()
	dur := taskCtx.FormatDuration(ctx)
	msg := "zipped"
	if !zipped {
		msg = "unzipped"
	}

	log.Event(ctx, "Page served",
		attr.Bool("http.compressed", zipped),
		semconv.HTTPRouteKey.String(fileName),
	)

	log.CallerStdout(ctx, fmt.Sprintf("*> Served %v %v (%v)", fileName, msg, dur))
}

var frontendRouter = makeFrontendRouter()

// stringArrayContains is golang.org/x/exp/slices.Contains for string
func stringArrayContains(array []string, val string) bool {
	for _, inArray := range array {
		if inArray == val {
			return true
		}
	}
	return false
}

// invalidPath mostly calls [fs.ValidPath] with a couple of extra checks.
func invalidPath(path string) bool {
	trimmed := strings.Trim(path, "/")
	return trimmed == "." || !fs.ValidPath(trimmed)
}

// etagForFile attempts to find the hash included in the filename of most
// files placed in the static assets directory by Webpack.
//
// Returns [errs.ErrBadRequest] if it cannot parse the (expected) hash part of the file name.
func etagForStaticFile(subFolder string, fileName string) (string, error) {
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
			return "", errs.BadRequestf("etagForStaticFile: unexpected name for css file %v", fileName)
		}
		// expecting len("main.") or len("i.") leftover
		if len(fileName)-lastDot < 2 {
			return "", errs.BadRequestf("etagForStaticFile: unexpected name for css file %v", fileName)
		}
		return fmt.Sprintf("\"%v%v\"", fileName[lastDot-hashLength:lastDot], ext), nil
	case "media":
		lastDot := strings.LastIndex(fileName, ".")
		// expect at least an original file with a name like f.js
		if lastDot == -1 || len(fileName) < lastDot-hashLength-3 {
			return "", errs.BadRequestf("etagForStaticFile: unexpected name for js file %v", fileName)
		}
		return fmt.Sprintf("\"%v\"", fileName[lastDot-hashLength : lastDot]), nil
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
			return "", errs.BadRequestf("etagForStaticFile: unexpected name for js file %v", fileName)
		}
		return fmt.Sprintf("\"%v%v\"", fileName[offset:offset+hashLength], ext), nil
	default:
		return "", errs.Internalf("etagForStaticFile: unknown subfolder %v", subFolder)
	}
}


// etagForTimestamp returns an etag for a file which was last modified at the given time.
func etagForTimestamp(modTime time.Time) string {
	// etags are formatted with RFC3339; ETag required quotes included in the format string.
	const etagTSFormat = "\"" + time.RFC3339 + "\""
	return modTime.UTC().Format(etagTSFormat)
}

// closeFile closes the given file and reports an error if the file could not be closed
func closeFile(ctx Context, file *os.File, path string) {
	if err := file.Close(); err != nil {
		err = errs.Internalf("closeFile: error closing %v: %w", path, err)
		span := trace.SpanFromContext(ctx)
		srOtel.WithSetError(span, err)
	}
}

// openFrontendFile attempts to open the given file, optionally first checking
// for a gzipped version first.
//
// [errs.NotFound] is returned if the file is not found.
//
// [errs.Internal] is returned and logged if there is an error opening
// (the uncompressed version of) the file.
func openFrontendFile(ctx Context, filePath string, useZipped bool) (file *os.File, zipped bool, err error) {
	var storagePath string

	_, span := srOtel.Tracer.Start(ctx, "routes.openFrontendFile",
		trace.WithSpanKind(trace.SpanKindInternal),
		trace.WithAttributes(
			attr.String("sr.server.openFrontendFile.path", filePath),
			attr.Bool("sr.server.openFrontendFile.useZipped", useZipped),
		),
	)
	defer span.End()

	// Find compressed file if possible
	if useZipped {
		// Start with <file>.gz instead
		storagePath = path.Join(config.FrontendBasePath, filePath + ".gz")
		file, err = os.Open(storagePath)
		if err == nil {
			span.AddEvent("Found gzipped file")
			return file, true, nil
		}

		// We ignore all errors here since we can try the uncompressed file.
		span.AddEvent("Gzipped file not found")
	}

	// Default to uncompressed file
	storagePath = path.Join(config.FrontendBasePath, filePath)
	file, err = os.Open(storagePath)
	if err == nil {
		span.AddEvent("Found uncompressed file")
		return file, false, nil
	}
	// If the file is not found, it's not an internal error. We also
	// don't record it on the span.
	if errors.Is(err, fs.ErrNotExist) {
		span.AddEvent("Requested file not found")
		return nil, false, errs.NotFoundf("openFrontendFile: %w: %v", err, storagePath)
	}
	// Otherwise, we got an internal error opening the regular file
	err = srOtel.WithSetError(span,
		errs.Internalf("openFrontendFile: error opening uncompressed file %v: %w", storagePath, err),
	)
	return nil, false, err
}

//
// /static/subdir/file.hash.ext
//

// handleFrontendStatic handles requests to /static/ paths, which are
// frontend static assets which are built for immutable caching. They are
// expected to be named with a hash that can be used as an etag.
//
// handleFrontendStatic expects SPA static assets to be layed out the way
// Webpack is configured in create-react-app, of the form
// /static/subdir/file.hash.ext
func handleFrontendStatic(response srHTTP.Response, request srHTTP.Request) {
	logFrontendRequest(request, "static")
	ctx := request.Context()
	requestPath := request.URL.Path
	requestDir, requestFile := path.Split(requestPath)
	fetchGzipped := config.FrontendGzipped && strings.Contains(request.Header.Get("Accept-Encoding"), "gzip")
	response.Header().Add("Vary", "Accept-Encoding")

	// Expecting /static/subdir/filename, can 404 early if this isn't met
	if invalidPath(requestPath) || strings.Count(requestDir, "/") != 3 {
		log.Printf(ctx, "Path %v is invalid", requestPath)
		srHTTP.Halt(ctx, errs.ErrNotFound)
	}
	// Check the list of valid subdirs
	subDir := requestDir[len("static/") : len(requestDir)-1]
	if !stringArrayContains(validStaticSubdirs, subDir[1:]) {
		log.Printf(ctx, "Invalid subdir %v", subDir)
		srHTTP.Halt(ctx, errs.ErrNotFound)
	}

	// Get the [zipped] static asset
	file, zipped, err := openFrontendFile(ctx, requestPath, fetchGzipped)
	srHTTP.Halt(ctx, err)
	defer closeFile(ctx, file, requestPath)

	// Get file info for if-modified-since
	info, err := file.Stat()
	srHTTP.HaltInternal(ctx, err)

	// /static files are always cached
	response.Header().Set("Cache-Control", cacheControlStatic)

	// Calculate etag, defaulting to file creation timestamp
	etag, err := etagForStaticFile(subDir[1:], requestFile)
	if err != nil {
		srOtel.RecordNonfatalError(ctx,
			errs.Internalf("Unable to add etag for %v: %w", requestFile, err),
		)
		etag = etagForTimestamp(info.ModTime())
	}

	// Add etag to file
	response.Header().Add("Etag", etag)

	// Add content-encoding if we _retrieved_ a zipped file
	if zipped {
		response.Header().Add("Content-Encoding", "gzip")

		// net/http.ServeContent doesn't set Content-Length if user specified Content-Encoding.
		// This doesn't work if the server is handling a range request, but AFAICT browsers don't
		// do range requests, especially for pages requested via HTML.
		if request.Header.Get("Range") == "" {
			request.Header.Set("Content-Length", fmt.Sprintf("%d", info.Size()))
		}
	}

	// Other content-types are set by netHTTP.ServeContent
	if strings.HasSuffix(requestFile, ".map") {
		response.Header().Set("Content-Type", "application/json")
	}

	// calls checkIfMatch(), which looks at modtime/If-Unmodified-Since and Etag/If-None-Match header.
	// we've already set the Etag, so if the client's already seen this, we can skip actually reading the file.
	netHTTP.ServeContent(response, request, requestFile, info.ModTime(), file)
	logServedContent(response, request, requestFile, zipped)
}

const (
	// Root: non-index.html files in FE root (manifest, robots.txt, favicon)

	// Root unproxied: browser cache for 10h
	cacheControlRoot = "public, max-age=36000"
	// Root proxied: browser cache for 10h, proxy can serve stale for 1h
	cacheControlRootProxied = "public, max-age=36000, state-if-error=3600"

	// Index unproxied: browser cache for 1h
	cacheControlIndex =  "public, max-age=3600"
	// Index proxied: browser cache for 1h, proxy can serve stale for 1h
	cacheControlIndexProxied = "public, max-age=3600, stale-if-error=3600"

	// Static: all files in /static are identified by name and immutable
	cacheControlStatic = "public, immutable, max-age=31536000"
)
// handleFrontendBase provides default routing for the frontend router.
//
// The default handler (for paths besides /static) respects the SPA nature of the
// frontend - it will serve /index.html, /favicon.ico, etc. but if it receives
// a path not in the file tree, it will default to serving /index.html.
// handleFrontendBase does not add an Etag or immutable caching; it relies on
// the last-modified timestamp on the file for cache-control.
func handleFrontendBase(response srHTTP.Response, request srHTTP.Request) {
	ctx := request.Context()
	logFrontendRequest(request, "base")
	requestPath := request.URL.Path
	requestDir, requestFile := path.Split(requestPath)
	fetchGzipped := config.FrontendGzipped && strings.Contains(request.Header.Get("Accept-Encoding"), "gzip")

	// Add standard Vary header
	response.Header().Add("Vary", "Accept-Encoding")

	// Default cache settings for favicon, manifest, robots.txt
	// Cache for a while (10h), revalidate if needed.
	// Proxies: cache for a while (1h) if we're down
	cacheControl := cacheControlRoot
	if config.ReverseProxied {
		cacheControl = cacheControlRootProxied
	}

	// prepareToServeIndex sets a few variables to be referring to /index.html
	prepareToServeIndex := func() {
		requestDir = "/"
		requestFile = "index.html"
		requestPath = "/index.html"
		cacheControl = cacheControlIndex
		if config.ReverseProxied {
			cacheControl = cacheControlIndexProxied
		}
	}

	// Check if we should be serving /index.html instead
	if requestDir == "/" && requestFile == "" {
		// / is an alias for the file /index.html
		log.Print(ctx, "Serving /index.html for path '/'")
		prepareToServeIndex()
	} else if strings.Count(requestDir, "/") != 1 {
		// If it's a subdir that's not /static, we know without checking that file doesn't exist
		// This should be the case with most SPA paths, i.e. /join/<gameID> but not /about.
		log.Printf(ctx, "Serving /index.html for subpath %v", requestDir)
		prepareToServeIndex()
	} else if requestFile != "index.html" {
		// Serve other files from site root, i.e. robots.txt
		log.Printf(ctx, "Checking for non-index file %v", requestFile)
	}

	// First, we attempt to serve the file - either index or some other root file
	file, zipped, err := openFrontendFile(ctx, requestPath, fetchGzipped)
	// We will default to serving /index if the file does not exist
	if errors.Is(err, errs.ErrNotFound) {
		log.Printf(ctx, "Non-index file %v does not exist, defaulting to /index", requestPath)
		prepareToServeIndex()
		file, zipped, err = openFrontendFile(ctx, "/index.html", fetchGzipped)
	}
	// Now we can halt with not found | internal
	srHTTP.Halt(ctx, err)
	defer closeFile(ctx, file, requestPath)

	// Get file mod time for etag and net/http.ServeContent
	info, err := file.Stat()
	srHTTP.HaltInternal(ctx, err)
	log.Record(ctx, "File", attr.String("name", info.Name()), attr.Int64("size", info.Size()))

	// http.ServeContent is setting a 200 response instead of 304 in some situations

	// Apply content-encoding header if needed
	if zipped {
		response.Header().Add("Content-Encoding", "gzip")

		// Go's http/ServeContent only sets this flag if you haven't set Content-Encoding.
		// We'd need to do range request math to satisfy range requests, but AFAICT
		// regular page requests won't use this header, especially for /index.html
		if request.Header.Get("Range") == "" {
			request.Header.Set("Content-Length", fmt.Sprintf("%d", info.Size()))
		}
	}

	// Add calculated Etag and Cache-Control headers
	response.Header().Add("Etag", etagForTimestamp(info.ModTime()))
	response.Header().Add("Cache-Control", cacheControl)

	// Serve the content in the file, sending the original MIME type (based on file name)
	netHTTP.ServeContent(response, request, requestFile, time.Time{}, file)
	logServedContent(response, request, requestFile, zipped)
}
