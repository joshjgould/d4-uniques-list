const { expect, browser, $ } = require('@wdio/globals');

const buildList = [];

describe('Get a list of uniques used in builds', () => {
    it('Get a list of builds from maxroll tier list', async () => {
        await browser.url(`https://maxroll.gg/d4/tierlists/endgame-tier-list`)
        const tierListSelector = '#main-article';
        const sectionSelector = 'div[class="my-2 flex flex-col gap-4"]';
        const buildSelector = 'div[class="border-grey-425 flex items-center border-b pr-4 pb-2 md:border-b-0 md:pb-0 md:pr-0"]';

        const sectionNodes = await $(tierListSelector).$$(sectionSelector);

        // iterate over each section
        for (let i = 0; i < sectionNodes.length; i++) {
          let buildNodes = await $(tierListSelector).$$(sectionSelector)[i].$$(buildSelector);

          // iterate over each build
          for (let j = 0; j < buildNodes.length; j++) {
            let name = await $(tierListSelector).$$(sectionSelector)[i].$$(buildSelector)[j].$(`a`).getText();
            let link = await $(tierListSelector).$$(sectionSelector)[i].$$(buildSelector)[j].$(`a`).getAttribute('href');
            buildList.push({ name, link });
          }
        }

        await expect(buildList.length).toBeGreaterThan(0);
    })

    it('Get a list of variants for each build', async () => {
      const variantList = [];

      for (const build of buildList) {
        await browser.url(build.link)
        const statPrioritySelector = 'div[class="_headers_1e0ye_7"]';

        const tabs = await $(statPrioritySelector).$$('div');
        const variants = [];
        // iterate over each section
        for (let i = 0; i < tabs.length; i++) {
          let variant = await $(statPrioritySelector).$$('div')[i].getText();
          variants.push(variant);
        }
        variantList.push({ name: build.name, variants});
        console.log(`variantList: `, variantList)
      }
    })
})

