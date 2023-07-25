const paths = {
  root: function () {
    return '/';
  },
  signIn: function () {
    return '/auth/sign-in';
  },
  signUp: function () {
    return '/auth/sign-up';
  },
  get home() {
    return this.root;
  },
  systemSetup: function () {
    return '/system-setup';
  },
  onboarding: {
    orgName: function () {
      return '/onboarding';
    },
    security: function ({ slug }: { slug: string }) {
      return `/onboarding/${slug}/security`;
    },
    roles: function ({ slug }: { slug: string }) {
      return `/onboarding/${slug}/roles`;
    },
  },
  settings: function () {
    return '/system-settings';
  },
  users: function () {
    return '/users';
  },
  dashboard: function () {
    return '/dashboard';
  },
  organization: function ({ slug }: { slug: string }) {
    return `/dashboard/${slug}`;
  },
  workspace: function (slug: string, workspaceSlug: string) {
    return `/dashboard/${slug}/workspace/${workspaceSlug}`;
  },
  document: function (slug: string, workspaceSlug: string, docId: string) {
    return `/dashboard/${slug}/workspace/${workspaceSlug}/document/${docId}`;
  },
  jobs: function ({ slug }: { slug: string }) {
    return `/dashboard/${slug}/jobs`;
  },
};

export default paths;
