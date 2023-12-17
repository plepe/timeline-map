# Module 'addParam'
Define a list of additional URL parameters which should be shown if set. Each value can either be a string or an object (with additional options for this parameter).

Available options:
- includeNull: if the value of this parameter is null, it should be included anyway (as "key=").

Example:
```yaml
addParam:
- id:
- path
- foo:
    includeNull: true
```
