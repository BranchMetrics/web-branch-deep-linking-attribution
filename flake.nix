{
  description = "NodeJS 16_x project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self }:
    let
      nixpkgs = nixpkgs;
      extra-pkgs = packages;
      utils = utils;
      system-utils = system-utils;
    in
    utils.lib.eachDefaultSystem (system:
      let
        stable-pkgs = nixpkgs.legacyPackages.${system};
        pkgs = stable-pkgs // {
          extra-pkgs = extra-pkgs.${system};
        };
        bazel-os = system-utils.getBazelOs system;
        nodejs = pkgs.extra-pkgs.nodejs-16_x;
      in
      {
        devShell = pkgs.mkShell {
          nativeBuildInputs = [
            nodejs
          ];
          shellHook = ''
            if [ -f $HOME/.config/bin/setup-webstorm-sdk ] && [ -f ./.idea/workspace.xml ]; then
              $HOME/.config/bin/setup-webstorm-sdk || echo "setup-webstorm-sdk failed"
            fi
          '';
        };
        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
