export function redirectIfSetupRequired(res, data, navigate) {
  if (res.status === 503 && data?.redirect) {
    navigate(data.redirect, { state: { message: data.message } });
    return true;
  }
  return false;
}
