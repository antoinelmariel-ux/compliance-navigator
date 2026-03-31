export const graphConfig = {
  enabled: true,
  tenantId: 'ec5406f0-238e-4d3f-b91c-73e26a5831e9',
  clientId: 'f579f3f8-a5e1-4166-ac99-6c7389e3592e',
  siteId: 'd0694d91-5626-4dc4-b738-0c61730474d4',
  siteUrl: 'https://lfb1.sharepoint.com/sites/ProjectNavigator_DEV/',
  indexUrl: 'https://lfb1.sharepoint.com/sites/ProjectNavigator_DEV/Documents%20partages/app/index.aspx',
  redirectUri: 'https://lfb1.sharepoint.com/sites/ProjectNavigator_DEV/Documents%20partages/app/index.aspx',
  scopes: ['User.Read', 'Sites.ReadWrite.All', 'Files.ReadWrite.All', 'Mail.Send'],
  lists: {
    projects: 'Projects',
    inspirations: 'Inspirations'
  }
};

export const isGraphRuntimeReady = () => {
  const value = graphConfig;
  const hasTenant = typeof value.tenantId === 'string' && value.tenantId.trim() !== '' && value.tenantId !== 'XXX';
  const hasClient = typeof value.clientId === 'string' && value.clientId.trim() !== '' && value.clientId !== 'XXX';
  const hasSite = typeof value.siteId === 'string' && value.siteId.trim() !== '' && value.siteId !== 'XXX';

  return value.enabled && hasTenant && hasClient && hasSite;
};
