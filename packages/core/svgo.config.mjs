export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,

          mergePaths: false,

          removeDesc: false,

          collapseGroups: false,

          moveGroupAttrsToElems: false,
          moveElemsAttrsToGroup: false,
        },
      },
    },

    'removeDimensions',
    'convertStyleToAttrs',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'cleanupNumericValues',
    'convertColors',
  ],
}
