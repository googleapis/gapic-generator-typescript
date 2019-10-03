mkdir showcase-server 
cd showcase-server
curl -L https://github.com/googleapis/gapic-showcase/releases/download/v0.5.0/gapic-showcase-0.5.0-darwin-amd64.tar.gz > gapic-showcase-server.tar.gz
if [ $? -eq 0 ]; then
    echo OK
else
    echo FAIL && exit
fi
tar -xzf gapic-showcase-server.tar.gz
cd ..
showcase-server/gapic-showcase --help
showcase-server/gapic-showcase run &
showcase_pid=$!
stop_showcase() {
	kill $showcase_pid
	# Wait for the process to die, but don't report error from the kill.
	wait $showcase_pid || true
}
mocha showcase.js
trap stop_showcase EXIT
