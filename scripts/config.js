const builds = {
  'webpack-plugin': {
    formats: ['cjs', 'esm'],
    external: ['glob'],
    plugins: [],
    external: [],
  },
  'zaf-event-channel': {
    formats: ['cjs', 'esm'],
  },
}

export const getBuildOptions = (packageName) => {
  return builds[packageName]
}
