#!/bin/bash

# Create a temporary directory for renamed files
mkdir -p temp-bracelets

echo "Renaming bracelet files with black-leather prefix..."

# Copy and rename files
cp "bracelets/bracelet-blue-sapphire-whitegold.PNG" "temp-bracelets/bracelet-black-leather-blue-sapphire-whitegold.PNG"
cp "bracelets/bracelet-blue-sapphire-yellowgold.PNG" "temp-bracelets/bracelet-black-leather-blue-sapphire-yellowgold.PNG"
cp "bracelets/bracelet-emerald-whitegold.PNG" "temp-bracelets/bracelet-black-leather-emerald-whitegold.PNG"
cp "bracelets/bracelet-pink-sapphire-whitegold.PNG" "temp-bracelets/bracelet-black-leather-pink-sapphire-whitegold.PNG"
cp "bracelets/bracelet-pink-sapphire-yellowgold.png" "temp-bracelets/bracelet-black-leather-pink-sapphire-yellowgold.png"
cp "bracelets/bracelet-ruby-whitegold.PNG" "temp-bracelets/bracelet-black-leather-ruby-whitegold.PNG"
cp "bracelets/bracelet-ruby-whitegold(1).PNG" "temp-bracelets/bracelet-black-leather-ruby-whitegold-alt.PNG"
cp "bracelets/bracelet.emerald-yellowgold.png" "temp-bracelets/bracelet-black-leather-emerald-yellowgold.png"
cp "bracelets/bracelet-preview.png" "temp-bracelets/bracelet-black-leather-preview.png"

echo "Files renamed successfully!"
echo "Renamed files are in temp-bracelets/ directory"
ls -la temp-bracelets/

echo ""
echo "Next: Upload these files to your Supabase Storage bucket manually or use the Supabase CLI"
