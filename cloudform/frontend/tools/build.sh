#!/bin/bash

rm -f *.js
tsc && \
    for filename in $(ls *.js); do mv -f $filename ${filename%.*} ; done && \
    echo "Build successful"