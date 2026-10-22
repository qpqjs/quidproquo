/**
 * The packages the builder layer provides at run time. They stay external in the lambda
 * bundle (rspack's binding is native and cannot be bundled) and resolve from the layer.
 */
export const USER_SCRIPT_BUILDER_LAYER_MODULES = ['@rspack/core', '@rspack/binding'] as const;
