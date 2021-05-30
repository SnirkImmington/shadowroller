package srctest

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"path/filepath"
	"strings"
	"sync"

	"sr/build"
)

var sourceFiles *token.FileSet = token.NewFileSet()

// os.ReadDir(name string) ([]DirEntry, error)
// DirEntry = fs.DirEntry

// ParseVirtualDir is parser.ParseDir rewritten for the embed FS.
func ParseVirtualDir(
	path string,
	filter func(fs.FileInfo) bool,
	mode parser.Mode,
) (pkgs map[string]*ast.Package, err error) {
	list, err := build.Source.ReadDir(path)
	if err != nil {
		return nil, fmt.Errorf("reading %v in source: %w", path, err)
	}
	pkgs = make(map[string]*ast.Package)
	for _, d := range list {
		if d.IsDir() || !strings.HasSuffix(d.Name(), ".go") {
			continue
		}
		if filter != nil {
			info, err := d.Info()
			if err != nil {
				return nil, fmt.Errorf("getting info on file %v: %w", d.Name(), err)
			}
			if !filter(info) {
				continue
			}
		}
		filename := filepath.Join(path, d.Name())
		fileSource, err := build.Source.ReadFile(filename)
		if err != nil {
			return nil, fmt.Errorf("reading source %v: %w", filename, err)
		}
		if src, err := parser.ParseFile(sourceFiles, filename, fileSource, mode); err == nil {
			name := src.Name.Name
			pkg, found := pkgs[name]
			if !found {
				pkg = &ast.Package{
					Name: name,
					Files: make(map[string]*ast.File),
				}
				pkgs[name] = pkg
			}
			pkg.Files[filename] = src
		} else {
			return nil, fmt.Errorf("parsing file %v: %w", filename, err)
		}
	}
	return pkgs, nil
}

var parseRoutes sync.Once
