#!/bin/bash

if [[ $EUID -ne 0 ]]; then
   echo -e "This script must be run as root"
   exit
fi
test -f /etc/NetworkManager/dispatcher.d/90apnmdispatcher && rm /etc/NetworkManager/dispatcher.d/90apnmdispatcher
mkdir -p /usr/share/cockpit/apsetup 
for i in networkvariables.sh apsetup.js index.html manifest.json apdnsmasqsetup 90apnmdispatcher network.css.gz; do
	wget https://raw.githubusercontent.com/cyberorg/apsetup-cockpit/master/src/usr/share/cockpit/apsetup/$i -O /usr/share/cockpit/apsetup/$i
done
chmod +x /usr/share/cockpit/apsetup/apdnsmasqsetup /usr/share/cockpit/apsetup/90apnmdispatcher
echo -e "Cockpit APsetup plugin installed"
