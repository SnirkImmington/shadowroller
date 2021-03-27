package task

import (
	"fmt"
	"io"
	"log"
	"os"
	"regexp"
	"strings"
)

// Closing content of the prerendered file. presite doesn't include a trailing newline!
const closingContent = `</body></html>`

// Yep, using a regex to find an HTML tag
var matchScriptSrc = regexp.MustCompile(`<script src="(/static/js/[^j]*js)">`)

func handleRewritePresiteIndexTask(buildIndexPath string, presiteIndexPath string) error {
	baseFile, err := os.Open(buildIndexPath)
	if err != nil {
		return fmt.Errorf("could not open base file %s: %w", buildIndexPath, err)
	}
	defer baseFile.Close()
	baseFileBytes, err := io.ReadAll(baseFile)
	if err != nil {
		return fmt.Errorf("could not read all from base file %s: %w", buildIndexPath, err)
	}
	log.Printf("Read build file %s", buildIndexPath)

	matches := matchScriptSrc.FindAll(baseFileBytes, -1)
	if len(matches) < 3 {
		return fmt.Errorf("Expected to get at least 3 script tags, got %v", matches)
	}
	var result strings.Builder
	for _, match := range matches {
		log.Printf("Found `%s`", match)
		result.Write(match)             // whole <script> tag
		result.WriteString("</script>") // and closing tag
	}

	presiteFile, err := os.OpenFile(presiteIndexPath, os.O_RDWR, 0o755)
	if err != nil {
		return fmt.Errorf("could not open presite file %s: %w", presiteIndexPath, err)
	}
	defer presiteFile.Close()
	log.Printf("Opened presite file %s", presiteIndexPath)
	info, err := presiteFile.Stat()
	if err != nil {
		return fmt.Errorf("could not stat prestie file %s: %w", presiteIndexPath, err)
	}
	offset := info.Size() - int64(len(closingContent))
	if _, err = presiteFile.Seek(offset, 0); err != nil {
		return fmt.Errorf("could not seek to offset %v (of %v) in %s: %w", offset, info.Size(), presiteIndexPath, err)
	}
	log.Printf("Seeked to end of file")

	if _, err = presiteFile.WriteString(result.String()); err != nil {
		return fmt.Errorf("could not write to presite file %s: %w", presiteIndexPath, err)
	}
	log.Printf("Wrote all the tags in")
	if _, err = presiteFile.WriteString(closingContent); err != nil {
		return fmt.Errorf("could not write closing to presite file %s: %w", presiteIndexPath, err)
	}
	return nil
}
