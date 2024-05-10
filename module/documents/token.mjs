export default class SkyfallToken extends TokenDocument {

  /** @override */
  static getTrackedAttributes(data, _path=[]) {
    return {
      bar: [
        ["resource", "hp"],
        ["resource", "ep"],
        ["resource", "shadow"],
      ],
      value: []
    }
  }
}
