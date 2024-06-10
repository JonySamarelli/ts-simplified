import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientService } from './services/http-client.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  file: File | null = null;
  programas: any[] = [];
  tsSections: any[] = [];
  reader = new FileReader();

  $menu: HTMLElement | null = null;
  $menuProgramas: HTMLElement | null = null;
  $menuConteudo: HTMLElement | null = null;
  
  constructor(private httpClientService: HttpClientService) {}

  ngAfterViewInit() {
    this.$menu = document.getElementById('menu');
    this.$menuProgramas = document.getElementById('menuProgramas');
    this.$menuConteudo = document.getElementById('menuConteudo');
  }

  selectFile() {
    const file = document.getElementById('fileInput') ? (document.getElementById('fileInput') as HTMLInputElement).files : null;

    if (file != null && file.length > 0) {
      this.file = file[0];
    } else {
      this.file = null;
    }
  }
  
  analyseFile() {
    this.$menuConteudo!.innerHTML = '';
    this.$menuConteudo!.classList.remove('remove-bg');
    if (this.file) {
      this.reader.readAsText(this.file);
      this.reader.onload = () => {
        const fileContent = this.reader.result as string;
        
        const sections = fileContent.split('!').filter(section => section.trim() !== '');
        const sectionsObj = sections.map(section => {
          const [sectionTitle, programa] = section.split('\n')[0].split('#').map(str => str.trim());
          
          const sectionDescription = section.split('\n').filter((line, index) => index > 0 && line.startsWith('#')).map(line => line.replace('#', '').trim()).join(' ');
          const query = section.split('\n').filter((line, index) => index > 0 && line.startsWith('?')).map(line => line.replace('?', '').trim()).join(' ');
          
          const inputs = section.split('\n').filter((line, index) => index > 0 && line.startsWith('@')).map(line => {
            const [type, label = '', description = '', selectDb = ''] = line.split('#').map(str => str.replace('@', '').trim());
            return {
              type,
              label,
              description,
              selectDb
            };
          });
          
          return {
            programa,
            title: sectionTitle,
            description: sectionDescription,
            inputs,
            query
          };
        });
        
        this.tsSections = sectionsObj;
        
        this.programas = [...new Set(sectionsObj.map(section => section.programa))];

        this.programas = this.programas.map(programa => {
          return {
            programa,
            conteudos: sectionsObj.filter(section => section.programa === programa)
          };
        });     

        const validQueries = this.tsSections.every(section => this.isQueryValid(section));
        
        if (validQueries) {
          this.montarMenu();
        }
      };
    }
  }

  isQueryValid(section: { title: string; query: string; inputs: { label: string; }[]; }) {
    const queryInputs = section.query.split(' ').map(input => input.trim());
    const inputsLabels = section.inputs.map(input => input.label);
    const valido = inputsLabels.every(input => queryInputs.includes(input));
    if (!valido) {
      alert(`A seção "${section.title}" possui inputs que não estão presentes na query`);
    }
    return valido;
  }

  montarMenu() {
    if (this.$menuProgramas) {
      this.$menuProgramas.innerHTML = '';
      this.programas.forEach(programa => {
        const $programa = document.createElement('div');
        const $titulo = document.createElement('div');
        $titulo.innerHTML = programa.programa;
        $titulo.classList.add('programa');
        $titulo.addEventListener('click', () => {
          if ($list.classList.contains('show')) {
            $list.classList.remove('show');
          } else {
            $list.classList.add('show');
          }
        });
        $programa.appendChild($titulo);
        
        const $list = document.createElement('ul');
        $list.classList.add('lista');
        $programa.appendChild($list);
        
        programa.conteudos.forEach((conteudo: { title: string; }) => {
          const $conteudo = document.createElement('li');
          $conteudo.innerHTML = conteudo.title;
          $conteudo.classList.add('conteudo');
          $conteudo.addEventListener('click', () => this.selecionarConteudo(conteudo));
          $list.appendChild($conteudo);
        });

        this.$menuProgramas?.appendChild($programa);
      });
    }
  }

  selecionarConteudo(conteudo: any) {
    this.$menuConteudo!.innerHTML = '';
    if (conteudo.inputs.length > 0) {
      this.$menuConteudo?.classList.add('remove-bg');
      const $titulo = document.createElement('h1');
      $titulo.innerHTML = conteudo.title;
      $titulo.classList.add('conteudo-titulo');
      this.$menuConteudo?.appendChild($titulo);

      const $descricao = document.createElement('p');
      $descricao.innerHTML = conteudo.description;
      $descricao.classList.add('conteudo-descricao');
      this.$menuConteudo?.appendChild($descricao);

      const $inputs = document.createElement('div');
      $inputs.classList.add('conteudo-inputs');

      conteudo.inputs.forEach((input: { label: string; type: string; description: string; selectDb: string}) => {
        const $input = document.createElement('div');
        $input.classList.add('conteudo-input');
        const $label = document.createElement('label');
        $label.innerHTML = input.description;
        $input.appendChild($label);
        if(input.type === 'select') {
          const $select = document.createElement('select');
          $select.setAttribute('placeholder', input.label);
          $select.classList.add('select');
          $input.appendChild($select);

          const $button = document.createElement('button');
          $button.innerHTML = 'Buscar';
          $button.classList.add('conteudo-buscar');
          $button.addEventListener('click', () => {
            this.populateSelect($select, input.selectDb);
          });
          $input.appendChild($button);
        } else {
          const $inputField = document.createElement('input');
          $inputField.setAttribute('type', input.type);
          $inputField.setAttribute('placeholder', input.label);
          $input.appendChild($inputField);
        }
        $inputs.appendChild($input);
      });
      
      this.$menuConteudo?.appendChild($inputs);

      const $button = document.createElement('button');
      $button.innerHTML = 'Executar';
      $button.classList.add('conteudo-executar');
      $button.setAttribute('disabled', 'true');
      $button.classList.add('disabled');
      $button.addEventListener('click', () => {
        const inputs = $inputs.querySelectorAll('input');
        const inputsArray = Array.from(inputs);
        const inputsValues = inputsArray.map(input => {
          return {
            label: input.getAttribute('placeholder'),
            value: input.value
          };
        });
        const query = conteudo.query.split(' ').map((input: string) => input.trim());
        inputsValues.forEach(input => {
          query[query.indexOf(input.label)] = input.value;
        });
        const queryStr = query.join(' ');
        console.log(queryStr);
      });

      $inputs.addEventListener('input', () => {
        const inputs = $inputs.querySelectorAll('input');
        const inputsArray = Array.from(inputs);
        const inputsValues = inputsArray.map(input => input.value);
        const inputsFilled = inputsValues.every(value => value.trim() !== '');
        if (inputsFilled) {
          $button.removeAttribute('disabled');
          $button.classList.remove('disabled');
        } else {
          $button.setAttribute('disabled', 'true');
          $button.classList.add('disabled');
        }
      });

      this.$menuConteudo?.appendChild($button);

    } else {
      this.$menuConteudo?.classList.remove('remove-bg');
    } 
  }

  populateSelect(select: HTMLSelectElement, selectDb: string) {
    console.log(select, selectDb);
    // this.httpClientService.getSelectOptions(selectDb).subscribe((res: any) => {
    //   select.innerHTML = '';
    //   res.forEach((option: any) => {
    //     const $option = document.createElement('option');
    //     $option.value = option.value;
    //     $option.innerHTML = option.label;
    //     select.appendChild($option);
    //   });
    // });
  };
}
