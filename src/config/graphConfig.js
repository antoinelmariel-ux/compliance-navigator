export const graphConfig = {
  enabled: true,
  tenantId: 'XXX',
  clientId: 'XXX',
  clientSecretValue: 'XXX',
  secretId: 'XXX',
  siteId: 'd0694d91-5626-4dc4-b738-0c61730474d4',
  siteUrl: 'https://lfb1.sharepoint.com/sites/ProjectNavigator_DEV/',
  indexUrl: 'https://lfb1.sharepoint.com/sites/ProjectNavigator_DEV/Documents%20partages/app/index.aspx',
  redirectUri: typeof window !== 'undefined' ? window.location.href.split('#')[0] : '',
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
