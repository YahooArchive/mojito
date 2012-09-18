export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start
wget http://selenium.googlecode.com/files/selenium-server-standalone-2.25.0.jar
java -jar selenium-server-standalone-2.25.0.jar -p 4444 > /dev/null 2>&1 &
cd node_modules/yahoo-arrow; npm install yui; cd ../..;
sleep 5