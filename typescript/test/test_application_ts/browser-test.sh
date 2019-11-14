showcase-server/gapic-showcase run &
showcase_pid=$!
stop_showcase() {
	kill $showcase_pid
	# Wait for the process to die, but don't report error from the kill.
	wait $showcase_pid || true
}
karma start
trap stop_showcase EXIT
