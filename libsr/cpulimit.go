package libsr

import (
	"bufio"
	"context"
	"io"
	"math"
	"os"
	"regexp"
	"runtime"
	"strconv"
	"strings"

	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/log"
)

const LIMITS_PATH = "/sys/fs/cgroup/cpu.stat"

var CPU_COUNT = regexp.MustCompile(`\d+$`)

var CPU_SHARE = regexp.MustCompile(`^(\S+) (\d+)$`)

// CountCPUs returns the number of CPUs on the system.
func CountCPUs() (int64, error) {
	cpuInfo, err := os.Open("/proc/cpuinfo")
	if err != nil {
		return 0, err
	}
	scanner := bufio.NewScanner(cpuInfo)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "cpu cores") {
			continue
		}
		foundCount := CPU_COUNT.FindString(line)
		found, err := strconv.ParseInt(foundCount, 10, 64)
		if err != nil {
			return 0, err
		}
		return found, nil
	}
	return 0, errs.NotFoundf("CPU count not found")
}

// GetCPULimit checks the cgroup CPU limit to determine how much CPU is
// available. It works on Alpine within a docker container.
func GetCPULimit() (float64, error) {
	// Unrestricted: `max 100000`
	//   Restricted: `x 100000` where x is a percent times 10000
	//   CPU = 2.25: `225000 100000`
	cpuLimits, err := os.Open("/sys/fs/cgroup/cpu.max")
	if err != nil {
		return 0, errs.NotFound(err)
	}
	read, err := io.ReadAll(cpuLimits)
	if err != nil {
		return 0, errs.Internal(err)
	}
	matches := CPU_SHARE.FindSubmatch(read)
	if len(matches) != 3 {
		return 0, errs.Internalf("expected 3 matches, got %v", matches)
	}
	limitStr := string(matches[1])
	totalStr := string(matches[2])

	if limitStr == "max" {
		return 0, nil
	}
	limit, err := strconv.ParseFloat(limitStr, 64)
	if err != nil {
		return 0, errs.Internalf("unable to parse share %v", limitStr)
	}
	total, err := strconv.ParseFloat(totalStr, 64)
	if err != nil {
		return 0, errs.Internalf("unable to parse share max %v", totalStr)
	}

	return limit / total, nil
}

// InitGoMaxProcs updates runtime.GOMAXPROCS to reflect cgroup limits imposed
// by Docker.
func InitGoMaxProcs(ctx context.Context) {
	cpuLimit, err := GetCPULimit()
	if err != nil {
		log.Printf(ctx, "Unable to get CPU limit: %v", err)
	} else if cpuLimit == 0 {
		log.Printf(ctx, "No CPU limit, not updating GOMAXPROCS")
	} else {
		log.Printf(ctx, "Found %v CPUs", cpuLimit)
		// We can apply the ceiling instead of floor in case of partial CPUs
		runtime.GOMAXPROCS(int(math.Ceil(cpuLimit)))
	}
}
