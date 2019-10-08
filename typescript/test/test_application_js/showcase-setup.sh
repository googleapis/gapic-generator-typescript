mkdir showcase-server 
cd showcase-server
export GAPIC_SHOWCASE_VERSION=0.5.0
export OS=`uname`
export ARCH=amd64
curl -L https://github.com/googleapis/gapic-showcase/releases/download/v${GAPIC_SHOWCASE_VERSION}/gapic-showcase-${GAPIC_SHOWCASE_VERSION}-${OS}-${ARCH}.tar.gz > gapic-showcase-server.tar.gz
if [ $? -eq 0 ]; then
    echo OK
else
    echo FAIL && exit
fi
tar -xzf gapic-showcase-server.tar.gz
cd ..
showcase-server/gapic-showcase run &
showcase_pid=$!
stop_showcase() {
	kill $showcase_pid
	# Wait for the process to die, but don't report error from the kill.
	wait $showcase_pid || true
}
mocha index.js
trap stop_showcase EXIT
