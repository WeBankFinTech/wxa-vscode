const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const baseURL = 'https://developers.weixin.qq.com/miniprogram/dev/component/';
const fetch = axios.create({
  baseURL
});

const request = async url => {
  console.log(`[Request] ${url} Start`);
  let response = await fetch.get(url);
  const $ = cheerio.load(response.data);
  console.log(`[Request] ${url} Succ`);
  return $;
};

const directiveSnippets = {
  'wx:for': {
    prefix: 'wx:for',
    body: ['wx:for="{{$1}}" wx:key="*this$2" wx:for-item="item" '],
    description: "在组件上使用 wx:for 控制属性绑定一个数组，即可使用数组中各项的数据重复渲染该组件。\n默认数组的当前项的下标变量名默认为 index，数组当前项的变量名默认为 item"
  },
  'wx:if': {
    prefix: 'wx:if',
    body: ['wx:if="{{$1}}" ']
  },
  'wx:elif': {
    prefix: 'wx:elif',
    body: ['wx:elif="{{$1}}" ']
  },
  'wx:else': {
    prefix: 'wx:else',
    body: ['wx:else']
  },
  block: {
    prefix: 'block',
    body: [`<block $1>$2</block>`]
  },

};

const main = async () => {
  let snippets = {...directiveSnippets};
  let attrSnippets = [];
  let componentSnippets = [];
  // 请求目录
  let $ = await request('');

  const doc = $('#docContent');

  let components = [];
  doc.find('h2').each((index, item) => {
    let component = {
      kind: $(item).text(),
      list: []
    };
    $(item)
      .next()
      .find('table tbody tr')
      .each((index, tbody) => {
        const componentId = $(tbody).find('td:nth-child(1)');
        const componentDesc = $(tbody).find('td:nth-child(2)');
        component.list.push({
          name: componentId.text(),
          link: componentId.children('a').attr('href'),
          desc: componentDesc.text()
        });
      });

    components.push(component);
  });

  // 获取所有组件信息 原生组件 无障碍访问去掉
  let attrsSet = new Set();

  let isSpec = kind => /原生组件/.test(kind) || /无障碍访问/.test(kind);

  let isLayout = kind => /视图容器/.test(kind) || /基础内容/.test(kind);

  for (const comKind of components) {
    if (isSpec(comKind.kind)) continue;

    for (const com of comKind.list) {
      let $com = await request(com.link);

      com.detailDesc = $com('#docContent > div > p:nth-child(1)').text();

      $com('#docContent .table-wrp table tbody tr').each((idx, td) => {
        com.attrs = com.attrs || '';
        com.attrs +=
          $com(td)
            .find('td:nth-child(1)')
            .text() + ' ';

        attrsSet.add(
          $com(td)
            .find('td:nth-child(1)')
            .text()
        );
      });

      $com('#Bug-Tip ~ ol li').each((idx, li) => {
        com.tips = com.tips || '';
        com.tips += $com(li).text() + '\n';
      });

      let idx = 1;
      componentSnippets.push({
        prefix: com.name,
        body: [
          `<${com.name} ${isLayout(comKind.kind) ? 'class="$' + idx++ + '"' : ''}>$${idx++}</${com.name}>`,
          '$' + idx
        ],
        description:
          (com.detailDesc === '' ? com.desc + '\n' : com.detailDesc) + (com.tips || '') +
          '\n文档链接: ' + baseURL + com.link
      });
    }
  }

  // 添加属性
  attrsSet.forEach(attr => {
    attrSnippets.push({
      prefix: attr,
      body: ['attr="$1" $2']
    });
  });
  
  componentSnippets.forEach((item) => {
    snippets['component ' + item.prefix] = item;
  });
  attrSnippets.forEach((item) => {
    snippets['attr ' + item.prefix] = item;
  });
  
  debugger;
  fs.writeFileSync(__dirname+path.sep+'snippets.gen.json', JSON.stringify(snippets, void(0), 4));
};

main();
