#!/bin/bash



mongo << MONGO
use hobbitmobile-1
db.userData.remove({'a' : '15740'})
MONGO
