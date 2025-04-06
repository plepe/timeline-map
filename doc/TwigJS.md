## Filters
### filter_objects()
As TwigJS does not support `|filter(...)`, this implements a simplified version.

Use the array as input, the first parameter the property to filter by, an optional second parameter the operation (default: ==), the last parameter the value.

Available operators: ==, !=, <, <=, >, >=, in (array)

Example usages:
```
[{"id":4},{"id":5},{"id": 6}]|filter("id", 5) -> [{"id":5}]
[{"id":4},{"id":5},{"id": 6}]|filter("id", "==", 5) -> [{"id":5}]
[{"id":4},{"id":5},{"id": 6}]|filter("id", "<", 5) -> [{"id":4},{"id":5}]
[{"id":4},{"id":5},{"id": 6}]|filter("id", "in", [5, 6]) -> [{"id":5},{"id":6}]
```

## Relations
Configure in `config.yaml`:
```yaml
relations:
  related_items:
    source: /related_items.json
    idField: tid # if omitted, 'id' is assumed
```

### relationGet (defined in src/relations.js)
A TwigJS function, that returns the a related item.

Parameters:
* type: type as defined in the config
* id: id of the item

### relation
A TwigJS function, that returns all related items based on a query.

Parameters:
* type: type as defined in the config
* query: an array of tuples, where each tuple is [key, value, op?]. if op is omitted, '==' is assumed. Available ops: '<', '>', '<=', '>=', '!='. ['id', 5, '<'] -> item['id'] < 5.
