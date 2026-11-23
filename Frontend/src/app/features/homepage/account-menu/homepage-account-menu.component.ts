import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideCheck, LucideChevronDown, LucideLogOut, LucideSettings } from '@lucide/angular';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { HomepageMode } from '../../../core/ui/preferences/ui-preferences.service';

const homepageModes: readonly HomepageMode[] = ['diorama', 'simple'];

@Component({
  selector: 'app-homepage-account-menu',
  imports: [NgOptimizedImage, LucideCheck, LucideChevronDown, LucideLogOut, LucideSettings],
  templateUrl: './homepage-account-menu.component.html',
  styleUrl: './homepage-account-menu.component.scss',
  host: {
    '(document:pointerdown)': 'closeOnOutsidePointer($event)',
    '(document:keydown)': 'closeOnEscape($event)',
  },
})
export class HomepageAccountMenuComponent {
  readonly selectedMode = input.required<HomepageMode>();
  readonly homepageModeRequested = output<HomepageMode>();
  readonly settingsRequested = output<void>();

  protected readonly i18n = inject(I18nService);
  protected readonly popoverOpen = signal(false);
  protected readonly isDemoAccount = signal(true);
  protected readonly displayName = computed(() =>
    this.isDemoAccount() ? 'rakoon' : this.i18n.t('guest'),
  );
  protected readonly accountLine = computed(() =>
    this.i18n.t(this.isDemoAccount() ? 'freePlan' : 'localGuestMode'),
  );
  protected readonly modes = homepageModes;

  private readonly injector = inject(Injector);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly accountTrigger = viewChild<ElementRef<HTMLButtonElement>>('accountTrigger');

  protected togglePopover(): void {
    if (this.popoverOpen()) {
      this.closePopover(false);
      return;
    }

    this.popoverOpen.set(true);
    afterNextRender(
      () => {
        if (!this.popoverOpen()) return;
        this.modeAction(this.selectedMode())?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  protected selectHomepageMode(mode: HomepageMode): void {
    if (mode === this.selectedMode()) {
      this.closePopover(false);
      return;
    }
    this.closePopover(false);
    this.homepageModeRequested.emit(mode);
  }

  protected requestSettings(): void {
    this.closePopover(false);
    this.settingsRequested.emit();
  }

  protected logOut(): void {
    this.isDemoAccount.set(false);
    this.closePopover(false);
    this.accountTrigger()?.nativeElement.focus({ preventScroll: true });
  }

  protected keepMenuKeyboardFocus(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.closePopover(false);
      return;
    }

    const items = this.menuItems();
    if (items.length === 0) return;
    const currentIndex = items.indexOf(event.target as HTMLButtonElement);
    let nextIndex: number | undefined;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    items[nextIndex]?.focus({ preventScroll: true });
  }

  protected closeOnOutsidePointer(event: PointerEvent): void {
    if (!this.popoverOpen()) return;
    const target = event.target;
    if (target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.closePopover(false);
    }
  }

  protected closeOnEscape(event: KeyboardEvent): void {
    if (!this.popoverOpen() || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    this.closePopover(true);
  }

  private modeAction(mode: HomepageMode): HTMLButtonElement | undefined {
    return (
      (this.host.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        `[data-homepage-mode="${mode}"]`,
      ) ?? undefined
    );
  }

  private menuItems(): HTMLButtonElement[] {
    return Array.from(
      (this.host.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"], [role="menuitem"]',
      ),
    );
  }

  private closePopover(restoreFocus: boolean): void {
    this.popoverOpen.set(false);
    if (restoreFocus) this.accountTrigger()?.nativeElement.focus({ preventScroll: true });
  }
}
