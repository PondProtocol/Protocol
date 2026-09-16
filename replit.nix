# Minimal Nix env so Replit can leave recovery mode.
# Node comes from the nodejs-20 module in .replit, not from this file.
# Do not add pkgs.nodejs-* here: a name that is missing on the channel
# is what breaks the workspace Nix build.
{ pkgs }: {
  deps = [ ];
}
