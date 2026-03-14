#!/bin/bash
# Hostinger Git deploy sonrasi public/ icerigini public_html/ kok dizinine tasir
cp -r public/* public_html/ 2>/dev/null
cp public/.htaccess public_html/ 2>/dev/null
cp public/.nojekyll public_html/ 2>/dev/null
cp data/*.json public_html/data/ 2>/dev/null
