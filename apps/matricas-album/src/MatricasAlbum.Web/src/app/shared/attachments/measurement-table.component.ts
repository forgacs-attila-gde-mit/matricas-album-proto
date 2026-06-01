import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AttachmentFrameComponent } from './attachment-frame.component';
import { ChipComponent } from '../ui/chip/chip.component';

interface Row {
  hely: string;
  burkolat: string;
  ido: string;
  mert: string;
  jegyzet: string;
}

/** Spreadsheet-like measurement table for week-3 evidence (e3/e4/e5). */
@Component({
  selector: 'ma-measurement-table',
  standalone: true,
  imports: [AttachmentFrameComponent, ChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ma-attachment-frame
      title="Hőmérséklet-mérési táblázat – 3. hét"
      type="Mérési adatlap (Excel-szerű)"
    >
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Helyszín</th>
              <th>Burkolat</th>
              <th>Idő</th>
              <th class="num">Mért érték</th>
              <th>Jegyzet</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows; track $index; let last = $last) {
              <tr [class.last]="last">
                <td>{{ r.hely }}</td>
                <td class="muted-cell">{{ r.burkolat }}</td>
                <td class="mono">{{ r.ido }}</td>
                <td class="num mono" [class.hot]="r.mert.startsWith('34')" [class.cold]="r.mert.startsWith('28') || r.mert.startsWith('29')">
                  {{ r.mert }}
                </td>
                <td class="muted-cell small">{{ r.jegyzet }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="strong">Átlag különbség nap vs. árnyék</td>
              <td class="num mono primary">+5,5°C</td>
              <td class="muted-cell small">6 mérés alapján</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="row" style="margin-top: 12px; gap: 8px; flex-wrap: wrap;">
        <ma-chip tone="warning" icon="info">Csapat: nem biztos, hogy mindenhol ugyanazt az eszközt használtuk</ma-chip>
        <ma-chip icon="schedule">12:30–12:55</ma-chip>
      </div>
    </ma-attachment-frame>
  `,
  styleUrl: './measurement-table.component.scss',
})
export class MeasurementTableComponent {
  readonly rows: Row[] = [
    { hely: 'Műfüves pálya, déli oldal',     burkolat: 'Műfű, nap',        ido: '12:30', mert: '34°C', jegyzet: 'Tűzött a nap, szél nem volt' },
    { hely: 'Műfüves pálya, déli oldal',     burkolat: 'Műfű, nap',        ido: '12:45', mert: '34°C', jegyzet: 'Ismétlő mérés' },
    { hely: 'Hárs alatt, kerékpártároló',    burkolat: 'Fű, árnyék',       ido: '12:35', mert: '28°C', jegyzet: 'Sűrű lombozat' },
    { hely: 'Hárs alatt, kerékpártároló',    burkolat: 'Fű, árnyék',       ido: '12:50', mert: '29°C', jegyzet: 'Néha napsugár átszűrődött' },
    { hely: 'Beton lépcső, főbejárat',       burkolat: 'Beton, fél napon', ido: '12:40', mert: '32°C', jegyzet: 'Délutáni napszak előtt' },
    { hely: 'Beton lépcső, főbejárat',       burkolat: 'Beton, fél napon', ido: '12:55', mert: '33°C', jegyzet: '15 perc alatt 1°C-ot melegedett' },
  ];
}
