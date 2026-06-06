export function getTeamProfileBasePath(pathname: string) {
  if (pathname.startsWith("/club/equipes")) {
    return "/club/equipes";
  }

  if (pathname.startsWith("/coach/equipes")) {
    return "/coach/equipes";
  }

  if (pathname.startsWith("/parents-referents/equipes")) {
    return "/parents-referents/equipes";
  }

  if (pathname.startsWith("/equipe/communication")) {
    return "/equipe/communication";
  }

  return "/equipes";
}
