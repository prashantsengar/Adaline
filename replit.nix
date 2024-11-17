{pkgs}: {
  deps = [
    pkgs.nettools
    pkgs.nodejs
    pkgs.nodePackages.typescript-language-server
    pkgs.postgresql
  ];
}
