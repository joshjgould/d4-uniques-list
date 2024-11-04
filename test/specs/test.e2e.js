const { expect, browser, $ } = require('@wdio/globals');
const fs = require('fs');
const { parse } = require('json2csv');

const buildList = [];
const itemList = [];

describe('Get a list of uniques used in builds', () => {
    it('Get a list of builds from maxroll tier list', async () => {
        await browser.url(`https://maxroll.gg/d4/tierlists/endgame-tier-list`)
        const tierListSelector = '#main-article';
        const sectionSelector = 'div[class="my-2 flex flex-col gap-4"]';
        const buildSelector = 'div[class="border-grey-425 flex items-center border-b pr-4 pb-2 md:border-b-0 md:pb-0 md:pr-0"]';

        const sectionNodes = await $(tierListSelector).$$(sectionSelector);

        // iterate over each section
        for (let i = 0; i < sectionNodes.length; i++) {
          let buildNodes = await sectionNodes[i].$$(buildSelector);

          // iterate over each build
          for (let j = 0; j < buildNodes.length; j++) {
            let name = await buildNodes[j].$(`a`).getText();
            let link = await buildNodes[j].$(`a`).getAttribute('href');
            buildList.push({ name, link });
          }
        }

        await expect(buildList.length).toBeGreaterThan(0);
    })

    it('Get a list of items for each build', async () => {
      for (const build of buildList) {
        await browser.url(build.link)
        const statPrioritySelector = 'div[class="_headers_1e0ye_7"]';
        const itemListSelector = 'div[class="d4t-PriorityEmbed"]';
        const activeTabSelector = 'div[class="_tab_1e0ye_1 _visible_1e0ye_88"]';

        let hasTabs = await $('div[class="_header_1e0ye_7 _headerActive_1e0ye_38"]').isExisting();
        const tabs = hasTabs ? await $(statPrioritySelector).$$('div') : await $('figure');
        const variants = [];

        // iterate over each tab
        for (let i = 0; i < tabs.length; i++) {
          let variant = await tabs[i].getText();
          variants.push(variant);
        }
        if (!hasTabs) variants.push('Specialty');

        for (const tab of variants) {
          let items;
          if (tab === 'Specialty') {
            items =  await $(itemListSelector).$('div[class="d4t-content"]').$$('div[class="d4t-item"]');
          } else {
            await $(statPrioritySelector).$(`div=${tab}`).click();
            const hasTabs = await $$(itemListSelector).length > 1 ? true : false;
            const hasActiveTab = await $(activeTabSelector).$(itemListSelector).isExisting();
            if (hasTabs && hasActiveTab) {
              items =  await $(activeTabSelector).$(itemListSelector).$('div[class="d4t-content"]').$$('div[class="d4t-item"]');
            } else if (hasTabs && !hasActiveTab) {
              // theres no items for this tab
            } else {
              items =  await $(itemListSelector).$('div[class="d4t-content"]').$$('div[class="d4t-item"]');
            }
          }

          if (items) {
            for (let j = 0; j < items.length; j++) {
              let isMythic = await items[j].$('div[class="d4t-body"]').$('div[class="d4t-header"]').$('span[class="d4-color-mythic"]').isExisting();
              let isUnique = await items[j].$('div[class="d4t-body"]').$('div[class="d4t-header"]').$('span[class="d4-color-unique"]').isExisting();
              if (isMythic || isUnique) {
                let item = await items[j].$('div[class="d4t-body"]').$('div[class="d4t-header"]').$('span[class^="d4-color-"]').getText();
                itemList.push({ item, build: build.name, variant: tab });
              }
            }
          }
        }
      }

      await expect(itemList.length).toBeGreaterThan(0);
    })
})

describe('Create CSV file', () => {
  it('Convert itemList object to CSV', () => {
    if (itemList.length) {
      const fields = Object.keys(itemList[0]);
      const opts = { fields };

      try {
        const csv = parse(itemList, opts);
        fs.writeFile(`d4-uniques-list.csv`, csv, function (err) {
          if (err) throw err;
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      console.log('No items to export');
    }
  });
});
