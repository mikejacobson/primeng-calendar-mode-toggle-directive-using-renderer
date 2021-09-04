import { Component, Directive, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Calendar } from 'primeng/calendar';

type SelectionMode = 'single' | 'range';
const defaultSelectionMode: SelectionMode = 'single';
const primeNgButtonClasses = 'p-button-text p-ripple p-button p-component';
const selectedClass = 'selected';
const styles = `
.toggle-wrapper {
    display: flex;
    align-items: center;
}

.toggle-wrapper button {s
    letter-spacing: 0.235px;
    padding: 8px;
}
.toggle-wrapper button.selected {
    font-weight: 700;
    letter-spacing: 0;
}

.toggle-wrapper span {
    font-size: 1.25em;
    opacity: 0.7;
    padding: 0;
}
`;

@Directive({
  selector: '[calendarModeToggle]'
})
export class CalendarModeToggleDirective implements OnInit, OnDestroy {
  stopListening;
  toggleWrapper: HTMLDivElement;
  buttons: HTMLButtonElement[];

  constructor(
    private el: ElementRef,
    private calendar: Calendar,
    private rn: Renderer2
  ) { }

  ngOnInit() {
    this.calendar.onShow.subscribe(() => {
      this.addToggleButtonToButtonBar();
    });

    this.calendar.onTodayClick.subscribe(() => {
      this.handleTodayClick();
    });
  }

  ngOnDestroy() {
    if (this.stopListening) {
      this.stopListening.forEach(fn => fn());
    }

    this.toggleWrapper = null;
    this.buttons = null;
  }

  handleTodayClick() {
    if (this.calendar.selectionMode === 'single') {
      return;
    }

    this.calendar.value = this.calendar.value[0];

    setTimeout(() => {
      this.setMode('single', this.buttons[0]);
      this.calendar.writeValue(this.calendar.value);
      this.calendar.hideOverlay();
    });
  }

  setMode(newMode: SelectionMode, clickedButton: HTMLButtonElement, { clearSelection = false } = {}) {
    this.calendar.selectionMode = newMode;
    this.deselectButtons();
    clickedButton.classList.add(selectedClass);

    if (clearSelection) {
      this.clearDateSelection();
    }
  }

  clearDateSelection() {
    const selectedMonth = this.calendar.currentMonth;
    const selectedYear = this.calendar.currentYear;

    this.calendar.writeValue(null);

    let didRestoreSelection = false;

    if (this.calendar.currentMonth !== selectedMonth) {
      this.calendar.currentMonth = selectedMonth;
      didRestoreSelection = true;
    }

    if (this.calendar.currentYear !== selectedYear) {
      this.calendar.currentYear = selectedYear;
      didRestoreSelection = true;
    }

    if (didRestoreSelection) {
      // prevent jump to current month when clearing selection
      this.calendar.createMonths(this.calendar.currentMonth, this.calendar.currentYear);
    }
  }

  deselectButtons() {
    this.buttons.forEach(button => button.classList.remove(selectedClass));
  }

  addToggleButtonToButtonBar() {
    if (!this.toggleWrapper) {
      const toggleWrapper = this.rn.createElement('div');    
      const dateButton = this.rn.createElement('button');
      const dateRangeButton = this.rn.createElement('button');
      const buttonSeparator = this.rn.createElement('span');
      const styleEl = this.rn.createElement('style');
  
      this.rn.appendChild(styleEl, this.rn.createText(styles));
      this.rn.appendChild(dateButton, this.rn.createText('Date'));
      this.rn.appendChild(dateRangeButton, this.rn.createText('Date Range'));
      this.rn.appendChild(buttonSeparator, this.rn.createText('|'));
      this.rn.appendChild(toggleWrapper, styleEl);
      this.rn.appendChild(toggleWrapper, dateButton);    
      this.rn.appendChild(toggleWrapper, buttonSeparator);
      this.rn.appendChild(toggleWrapper, dateRangeButton);
  
      this.rn.addClass(toggleWrapper, 'toggle-wrapper');
      this.rn.setAttribute(dateButton, 'class', primeNgButtonClasses);
      this.rn.setAttribute(dateRangeButton, 'class', primeNgButtonClasses);
      this.rn.setAttribute(buttonSeparator, 'class', 'p-button p-button-text');

      this.toggleWrapper = toggleWrapper;
      this.buttons = [dateButton, dateRangeButton];
      this.stopListening = [
        this.rn.listen(dateButton, 'click', () => this.setMode('single', dateButton, { clearSelection: true })),
        this.rn.listen(dateRangeButton, 'click', () => this.setMode('range', dateRangeButton, { clearSelection: true }))
      ];

      this.setMode('single', dateButton);
    }

    const buttonBar = this.el.nativeElement.querySelector('.p-datepicker-buttonbar');
    const lastButton = buttonBar.children[1];

    this.rn.insertBefore(buttonBar, this.toggleWrapper, lastButton);
  }
}
