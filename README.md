# scss颜色变量提示
![alt text](iShot_2024-11-12_10.32.00.gif)
- 配置 settings.json
```json
 "var-css-support": {
    "entry": ["/src/assets/sass/_variable.scss"], // 变量源文件
    "fileType": [ //需要检测的文件类型
      "scss",
      "css",
      "vue"
    ]
  }
```