#!/bin/bash -x

date=$(date +%F)
cd /home/ec2-user/trap4004/reports

files="*.txt *.html"

mkdir -p history/${date}

for f in $files
do
  b=$(basename $f)
  cp $f history/${date}/${b}
done

cp -R ally history/${date}/ally
cp -R enemy history/${date}/enemy
