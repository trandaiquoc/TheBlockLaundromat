import { TestBed } from '@angular/core/testing';
import { SearchableDropdownComponent } from './searchable-dropdown.component';

describe('SearchableDropdownComponent', () => {
  it('names the current selection alongside the control context', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [
      {
        id: '1.21.1',
        label: 'Java 1.21.1',
        secondary: 'Verified support',
      },
    ]);
    fixture.componentRef.setInput('selectedId', '1.21.1');
    fixture.componentRef.setInput('ariaLabel', 'Minecraft version');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement;
    expect(trigger.getAttribute('role')).toBeNull();
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    expect(trigger.getAttribute('aria-label')).toBe(
      'Minecraft version, Java 1.21.1, Verified support',
    );
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const listbox = document.body.querySelector('[role="listbox"]') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
    const search = document.body.querySelector('.dropdown-search') as HTMLInputElement;
    expect(search.getAttribute('role')).toBe('combobox');
    expect(search.getAttribute('aria-controls')).toBe(listbox.id);
    fixture.destroy();
  });

  it('opens, filters, selects, and closes with Escape', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [
      { id: 'minecraft:diamond', label: 'Diamond', secondary: 'minecraft:diamond' },
      { id: 'minecraft:oak_log', label: 'Oak Log', secondary: 'minecraft:oak_log' },
    ]);
    fixture.componentRef.setInput('placeholder', 'Search items');
    fixture.componentRef.setInput('emptyLabel', 'Empty frame');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.dropdown-trigger') as HTMLButtonElement;
    expect(host.querySelector('.dropdown-popover')).toBeNull();
    trigger.click();
    fixture.detectChanges();
    const overlay = () => document.body.querySelector('.dropdown-popover');
    expect(overlay()).toBeTruthy();
    const input = document.body.querySelector('.dropdown-search') as HTMLInputElement;
    input.value = 'oak';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(document.body.textContent).toContain('Oak Log');
    expect(document.body.textContent).not.toContain('Diamond');
    (
      document.body.querySelector('.dropdown-option:not(.active-option)') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(overlay()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    fixture.detectChanges();
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(overlay()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('focuses the search field only after the connected overlay attaches', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [{ id: 'minecraft:diamond', label: 'Diamond' }]);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const search = document.body.querySelector('.dropdown-search') as HTMLInputElement;
    expect(search).toBeTruthy();
    expect(document.activeElement).toBe(search);
    fixture.destroy();
  });

  it('keeps the selected row separate from keyboard focus on open', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [
      { id: 'minecraft:diamond', label: 'Diamond' },
      { id: 'minecraft:oak_log', label: 'Oak Log' },
    ]);
    fixture.componentRef.setInput('selectedId', 'minecraft:oak_log');
    let selected = '';
    fixture.componentInstance.selectionChange.subscribe((id) => (selected = id));
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    (host.querySelector('.dropdown-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(document.body.querySelector('.dropdown-option.selected')?.textContent).toContain(
      'Oak Log',
    );
    expect(document.body.querySelector('.dropdown-option.active-option')).toBeNull();

    const input = document.body.querySelector('.dropdown-search') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(selected).toBe('');
    expect(document.body.querySelector('.dropdown-popover')).toBeTruthy();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.body.querySelector('.dropdown-option.active-option')).toBeTruthy();
  });

  it('returns focus to the combobox after keyboard selection closes the popover', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [{ id: 'minecraft:diamond', label: 'Diamond' }]);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();

    const search = document.body.querySelector('.dropdown-search') as HTMLInputElement;
    search.focus();
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    const activeId = search.getAttribute('aria-activedescendant');
    expect(document.getElementById(activeId ?? '')?.textContent).toContain('Diamond');
    expect(document.getElementById(activeId ?? '')?.getAttribute('role')).toBe('option');
    expect(
      [...document.body.querySelectorAll<HTMLButtonElement>('[role="option"]')].every(
        (option) => option.tabIndex === -1,
      ),
    ).toBe(true);
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.querySelector('.dropdown-popover')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fixture.destroy();
  });

  it('lets keyboard users choose the empty value from the searchable options', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [{ id: 'minecraft:diamond', label: 'Diamond' }]);
    fixture.componentRef.setInput('selectedId', 'minecraft:diamond');
    fixture.componentRef.setInput('emptyLabel', 'Empty slot');
    const selected: string[] = [];
    fixture.componentInstance.selectionChange.subscribe((id) => selected.push(id));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const search = document.body.querySelector('.dropdown-search') as HTMLInputElement;
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    const activeId = search.getAttribute('aria-activedescendant');
    expect(document.getElementById(activeId ?? '')?.textContent).toContain('Empty slot');

    search.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(selected).toEqual(['']);
    expect(document.body.querySelector('.dropdown-popover')).toBeNull();
    fixture.destroy();
  });

  it('closes when keyboard focus leaves the search popup without stealing focus', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [{ id: 'minecraft:diamond', label: 'Diamond' }]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    fixture.detectChanges();

    expect(document.body.querySelector('.dropdown-popover')).toBeNull();
    expect(document.activeElement).toBe(outside);
    outside.remove();
    fixture.destroy();
  });

  it('drops the active descendant when the available options are replaced', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput('options', [{ id: 'minecraft:diamond', label: 'Diamond' }]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const search = document.body.querySelector('.dropdown-search') as HTMLInputElement;
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(search.hasAttribute('aria-activedescendant')).toBe(true);

    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();

    expect(search.hasAttribute('aria-activedescendant')).toBe(false);
    fixture.destroy();
  });

  it('caps prepared search results for large option sets', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableDropdownComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SearchableDropdownComponent);
    fixture.componentRef.setInput(
      'options',
      Array.from({ length: 10000 }, (_, index) => ({
        id: `example:${index}`,
        label: `Block ${index}`,
        secondary: 'Example Mod',
      })),
    );
    fixture.detectChanges();
    fixture.componentInstance['setQuery']({ target: { value: 'example mod' } } as unknown as Event);
    expect(fixture.componentInstance['filteredOptions']()).toHaveLength(100);
  });
});
