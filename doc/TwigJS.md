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
