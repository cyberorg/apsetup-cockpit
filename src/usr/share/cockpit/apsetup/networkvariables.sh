#!/bin/bash
#Script to get various network variables
#======================================
# Helper function - return ethernet interface and ip-address
#--------------------------------------
ip_address(){
	ip address | awk '/inet6/{next} /inet.*/{print $2 " " $NF }' | egrep -v "^127\." | grep -v tun | grep -v wl |grep -v dock | grep -v veth | grep -v br-
}
wl_interface(){
	export WL_IFACE=`ifconfig -a|grep wl|cut -d ":" -f1`
}
wl_interface
AP_IP=$(ip address | awk '/inet6/{next} /inet.*/{print $2 " " $NF }' | grep $WL_IFACE | cut -d / -f1)

#======================================
# Helper function - return ethernet interface and ip-address
# created for easy testing
#--------------------------------------
ip_route(){
	ip route
}

#======================================
# Check ip-addresses and interfaces 
# and search local network, if not specified
#--------------------------------------
init_network_variables() {
	local default_ips=
	local default_eths=
 	local default_nets=
	local default_ranges=
	local default_netmasks=
	if [[ -n `echo $DHCP_IFACES | grep -i "any"` ]] ; then
		DHCP_IFACES=
		SERVER_IPS=
	fi
	SERVER_IPS="$(echo $SERVER_IPS)"    # remove [:space:]
	DHCP_IFACES="$(echo $DHCP_IFACES)"
	#======================================
	# Only interfaces defined
	#--------------------------------------
	if [[ -n $DHCP_IFACES && -z $SERVER_IPS ]] ; then
		default_eths="$DHCP_IFACES"
		for eth_ in $default_eths
			do
			default_ips="$default_ips `ip_address  | grep $eth_ | cut -f1 -d' ' | egrep -m 1 "*"`"
			# FIXME: it don't work with multiple ips assigned to one interface (currently used only first ip)
		done
	#======================================
	# Only ip-addresses defined
	#--------------------------------------
	elif [[ -z $DHCP_IFACES && -n $SERVER_IPS ]] ; then
		default_ips="$SERVER_IPS"
		for ip_ in $default_ips
		do
			default_eths="$default_eths `ip_address | grep $ip_ | cut -f2 -d' ' `"
		done
	#======================================
	# Autodetect ip-addresses and interfaces
	#--------------------------------------
	elif [[ -z $DHCP_IFACES && -z $SERVER_IPS ]] ; then
		eth_ips="`ip_address  | cut -f1 -d' ' `"
		for ip_ in $eth_ips
			do
			[[ -n "`echo $ip_ | grep   ^10.`"         ]] && default_ips="$default_ips $ip_"
			[[ -n "`echo $ip_ | egrep '^172.1[6-9]'`" ]] && default_ips="$default_ips $ip_"
			[[ -n "`echo $ip_ | egrep '^172.2[0-9]'`" ]] && default_ips="$default_ips $ip_"
			[[ -n "`echo $ip_ | egrep '^172.3[0-1]'`" ]] && default_ips="$default_ips $ip_"
			[[ -n "`echo $ip_ | grep   ^192.168.`"    ]] && default_ips="$default_ips $ip_"
		done
		# if empty add first interface
		[[ -z "$default_ips" ]] && default_ips="`echo $eth_ips | cut -f1 -d' '`"
		
		for ip_ in $default_ips
		do
			default_eths="$default_eths  `ip_address | grep $ip_ | cut -f2 -d' ' `"
		done
		#======================================
 		# don't use default route network if there is more than one
		#--------------------------------------
		local ethcount=`echo "$default_eths" | wc -w`
		if [[ $ethcount > 1 ]] ; then 
			eth_=`ip_route | awk '/default via/{print $5}'`
			ip_="`ip_address  | grep $eth_ | cut -f1 -d' ' `"
			default_eths=$(echo $default_eths | tr '[:space:]' '\n' | grep -v "$eth_" | tr '\n' ' ' )
			default_ips=$(echo $default_ips | tr '[:space:]' '\n' | grep -v "$ip_" | tr '\n' ' ' )
			echo "Interface $eth_ is connected to your default network and will be used to provide internet services,"
			default_eths=$eth_
		fi
		echo "Next interfaces will be configured to provide internet services: $default_eths"
	#======================================
	# ip-addresses and interfaces defined
	#--------------------------------------
	elif [[ -n $DHCP_IFACES && -n $SERVER_IPS ]] ; then
		default_eths="$DHCP_IFACES"
		default_ips="$SERVER_IPS"
	else # this should never happen
		echo "Something very strange happened - exiting"
		exit 1
	fi
	
	export SERVER_IP=$AP_IP
	#======================================
	# Init DHCP_SUBNETS, DHCP_NETMASKS and DHCP_RANGES
	#--------------------------------------
	i=0
	for eth_ in $WL_IFACE
		do
		((i++))
		local ip_="$SERVER_IP"
		#======================================
		# Convert netmask from /N to N.N.N.N
		#--------------------------------------
		local def_nm="`ip a | grep $eth_ | grep $ip_ |awk '/inet6/{next} /inet .*brd .*scope global /{print $2 }' | cut -f2 -d'/' | cut -f1 -d' '`"
		KL_NETWORKS="$KL_NETWORKS `ip a | grep $eth_ | grep $ip_ |awk '/inet6/{next} /inet .*brd .*scope global /{print $2 }'`"
		for (( j=0 ; j<4 ; j++ )) 
			do
			if [[ $((def_nm - 8 >= 0)) = 1 ]] ; then
				def_nm="$((def_nm-8))"
				default_netmasks="$default_netmasks$((2**8-1))."
			else
				if [[ $def_nm = 0 ]] ; then
					default_netmasks="${default_netmasks}0."
				else
					default_netmasks="$default_netmasks$((256-(2**(8-def_nm))))."
					def_nm=0
				fi
			fi
		done
		default_netmasks="${default_netmasks%\.} "
		
		# TODO: rework default_ranges
		local rangeEnd=252
		local rangeStart=20
		if [[ $def_nm != 0 ]] ; then
			local nmask=${default_netmasks##*\.}
			rangeEnd=$((255-nmask-2))
			[[ $rangeEnd<=30 ]] && rangeStart=2
		fi
		default_ranges="$default_ranges ${ip_%\.*}.$rangeStart ${ip_%\.*}.$rangeEnd"
		default_nets="$default_nets `ip_route | grep ${eth_%:*} | grep ${ip_%\/??} | cut -f1 -d'/'`"
	done
	# Init global network variables 
	DHCP_SUBNETS="$default_nets"
	DHCP_NETMASKS="$default_netmasks"
	DHCP_RANGES="$default_ranges"
	#======================================
	# Init empty varables
	#--------------------------------------
	default_ips="`echo $default_ips | sed 's/\/..//g'`"
	: ${SERVER_IP:="`echo $default_ips | cut -f1 -d' '`"}  # use only first server
	: ${SERVER_IPS:="$default_ips"}
	: ${DHCP_IFACES:="$default_eths"}
	: ${DOMAIN:="digitalairlines.com"}
	: ${NAME_SERVERS:="8.8.8.8"} # Google DNS
	: ${GATEWAYS:="$SERVER_IPS"}
	: ${TFTP_SERVERS:="$SERVER_IPS"}
	#======================================
	# Init global network variables 
	#--------------------------------------
	DHCPD_INTERFACE="$DHCP_IFACES"
	#======================================
	# check networking variables 
	#--------------------------------------
	if [ ! "$DOMAIN" -o ! "$NAME_SERVERS" -o ! "$GATEWAYS" -o ! "$TFTP_SERVERS" -o ! "$DHCP_RANGES" -o ! "$DHCP_SUBNETS" -o ! "$DHCP_NETMASKS" -o ! "$SERVER_IPS" -o ! "$SERVER_IP" ]; then
		echo "One or more KIWI LTSP networking variables are empty."
	fi
}
init_network_variables
#echo server ip $SERVER_IP
#echo server ips $SERVER_IPS
#echo dhcp iface $DHCP_IFACES
