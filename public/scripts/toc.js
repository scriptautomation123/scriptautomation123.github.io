function initToc() {
  const toc = document.querySelector('.toc');
  if (!toc) return;
  const tocBody = toc.querySelector('.toc-body');
  if (!tocBody) return;

  const buildNestedToc = () => {
    const headingNodes = Array.from(document.querySelectorAll('.prose h2[id], .prose h3[id]'));
    const sections = [];
    let currentSection = null;

    for (const node of headingNodes) {
      const id = node.getAttribute('id');
      if (!id) continue;
      const level = node.tagName.toLowerCase();
      if (level === 'h2') {
        currentSection = { id, title: node.textContent || id, children: [] };
        sections.push(currentSection);
        continue;
      }
      if (level === 'h3' && currentSection) {
        currentSection.children.push({ id, title: node.textContent || id });
      }
    }

    tocBody.innerHTML = '';

    for (const section of sections) {
      if (section.children.length > 0) {
        const details = document.createElement('details');
        details.className = 'toc-group';
        details.dataset.slug = section.id;

        const summary = document.createElement('summary');
        summary.className = 'toc-summary';
        const titleSpan = document.createElement('span');
        titleSpan.className = 'toc-summary-text';
        titleSpan.textContent = section.title;
        const jump = document.createElement('a');
        jump.className = 'toc-jump';
        jump.href = `#${section.id}`;
        jump.textContent = '↗';
        jump.setAttribute('aria-label', `Jump to ${section.title}`);
        summary.append(titleSpan, jump);
        details.append(summary);

        const list = document.createElement('ul');
        for (const child of section.children) {
          const li = document.createElement('li');
          li.className = 'depth-3';
          const link = document.createElement('a');
          link.className = 'toc-link';
          link.href = `#${child.id}`;
          link.textContent = child.title;
          li.appendChild(link);
          list.appendChild(li);
        }
        details.append(list);
        tocBody.append(details);
      } else {
        const link = document.createElement('a');
        link.className = 'toc-link toc-parent';
        link.href = `#${section.id}`;
        link.textContent = section.title;
        tocBody.append(link);
      }
    }
  };

  buildNestedToc();

  const tocLinks = Array.from(toc.querySelectorAll('.toc-link[href^="#"]'));
  if (tocLinks.length === 0) return;

  const headings = tocLinks
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute('href')?.slice(1) || '');
      if (!id) return null;
      const node = document.getElementById(id);
      if (!node) return null;
      return { id, node, link };
    })
    .filter(Boolean);

  if (headings.length === 0) return;

  let raf = 0;

  const setActive = (activeId) => {
    for (const item of headings) {
      item.link.classList.toggle('active', item.id === activeId);
    }

    for (const group of Array.from(toc.querySelectorAll('.toc-group'))) {
      group.classList.remove('is-active');
      const summary = group.querySelector('summary');
      if (summary) summary.classList.remove('active');
    }

    const activeLink = toc.querySelector(`.toc-link[href="#${CSS.escape(activeId)}"]`);
    if (!activeLink) return;

    const activeGroup = activeLink.closest('.toc-group');
    if (activeGroup) {
      activeGroup.classList.add('is-active');
      const summary = activeGroup.querySelector('summary');
      if (summary) summary.classList.add('active');
    }
  };

  const updateActive = () => {
    const offset = 120;
    let active = headings[0];

    for (const item of headings) {
      const top = item.node.getBoundingClientRect().top;
      if (top - offset <= 0) {
        active = item;
      } else {
        break;
      }
    }

    setActive(active.id);
  };

  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateActive();
    });
  };

  updateActive();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

initToc();
