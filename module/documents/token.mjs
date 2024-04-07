export default class SkyfallToken extends TokenDocument {

  /** @override */
  static getTrackedAttributes(data, _path=[]) {
    return {
      bar: [
        ["recurso", "vida"],
        ["recurso", "enfase"],
        ["recurso", "sombra"],
      ],
      value: []
    }
  }
}
