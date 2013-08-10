#!/bin/bash



mongo hobbitmobile-1 << MONGO
db.userData.remove({'a' : '15740'})
MONGO
