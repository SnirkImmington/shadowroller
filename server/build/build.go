// package build contains values which are inserted at compile time.
package build

import (
	"embed"
)

// Version is the semver version of the project.
var Version string

// Commit is the commit SHA of the project.
var Commit string

// Source is the source code of the project.
// go:embed .
var Source embed.FS
