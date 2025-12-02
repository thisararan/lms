export const triggerDashboardRefresh = () => {
  window.dispatchEvent(new Event('dashboardRefresh'));
  const currentTime = Date.now();
  localStorage.setItem('dashboard_last_update', currentTime.toString());
  console.log('Dashboard refresh triggered');
};

export default triggerDashboardRefresh;