#!/bin/bash

# Colors to use for output
RED='\033[0;31m'
GREEN='\033[0;32m'


if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root"
   exit
fi
mkdir -p /usr/share/cockpit/apsetup
cd /usr/share/cockpit/apsetup/
for i in networkvariables.sh apsetup.js index.html manifest.json apdnsmasqsetup 90apnmdispatcher network.css.gz; do
	wget -c https://raw.githubusercontent.com/cyberorg/apsetup-cockpit/master/src/usr/share/cockpit/apsetup/$i
done
chmod +x /usr/share/cockpit/apsetup/apdnsmasqsetup /usr/share/cockpit/apsetup/90apnmdispatcher
echo -e "${GREEN} Cockpit APsetup plugin installed"
