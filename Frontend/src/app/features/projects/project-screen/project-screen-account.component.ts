import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LucideChevronDown, LucideLogOut } from '@lucide/angular';
import { I18nService } from '../../../core/ui/localization/i18n.service';

@Component({
  selector: 'app-project-screen-account',
  imports: [NgOptimizedImage, LucideChevronDown, LucideLogOut],
  templateUrl: './project-screen-account.component.html',
  styleUrl: './project-screen-account.component.scss',
  host: {
    '(document:pointerdown)': 'closeOnOutsidePointer($event)',
    '(document:keydown)': 'closeOnEscape($event)',
  },
})
export class ProjectScreenAccountComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly isDemoAccount = signal(true);
  protected readonly popoverOpen = signal(false);
  protected readonly displayName = computed(() =>
    this.isDemoAccount() ? 'rakoon' : this.i18n.t('guest'),
  );
  protected readonly accountLine = computed(() =>
    this.i18n.t(this.isDemoAccount() ? 'freePlan' : 'localGuestMode'),
  );

  private readonly injector = inject(Injector);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly accountTrigger = viewChild<ElementRef<HTMLButtonElement>>('accountTrigger');
  private readonly accountPopover = viewChild<ElementRef<HTMLElement>>('accountPopover');
  private readonly logoutAction = viewChild<ElementRef<HTMLButtonElement>>('logoutAction');

  protected togglePopover(): void {
    if (this.popoverOpen()) {
      this.closePopover(false);
      return;
    }

    this.popoverOpen.set(true);
    afterNextRender(
      () => {
        if (!this.popoverOpen()) return;
        const focusTarget = this.isDemoAccount()
          ? this.logoutAction()?.nativeElement
          : this.accountPopover()?.nativeElement;
        focusTarget?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  protected logOut(): void {
    this.isDemoAccount.set(false);
    this.closePopover(false);
    this.accountTrigger()?.nativeElement.focus({ preventScroll: true });
  }

  protected closeWhenFocusLeaves(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget)) return;
    this.closePopover(false);
  }

  protected keepMenuKeyboardFocus(event: KeyboardEvent): void {
    if (!this.isDemoAccount()) return;

    if (event.key === 'Tab') {
      this.closePopover(false);
      return;
    }

    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.preventDefault();
      this.logoutAction()?.nativeElement.focus({ preventScroll: true });
    }
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

  private closePopover(restoreFocus: boolean): void {
    this.popoverOpen.set(false);
    if (restoreFocus) this.accountTrigger()?.nativeElement.focus({ preventScroll: true });
  }
}
