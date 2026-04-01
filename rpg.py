import sys
import json
from pathlib import Path

from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont
from PyQt5.QtWidgets import (
    QApplication,
    QFileDialog,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QPushButton,
    QSizePolicy,
    QSpinBox,
    QTableWidget,
    QTableWidgetItem,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

class RPGMasterApp(QMainWindow):
    def apply_crew_heal(self, row, heal):
        crew = self.ship['crew'][row]
        new_hp = min(crew['maxHp'], crew['hp'] + heal)
        crew['hp'] = new_hp
        self.update_crew_table()
        self.save_data()

    def confirm_remove_crew(self, row):
        from PyQt5.QtWidgets import QMessageBox
        reply = QMessageBox.question(self, 'Remover Tripulante',
                                     f'Tem certeza que deseja remover o tripulante "{self.ship["crew"][row]["name"]}"?',
                                     QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if reply == QMessageBox.Yes:
            self.remove_crew(row)

    def remove_crew(self, row):
        self.ship['crew'].pop(row)
        self.update_crew_table()
        self.save_data()
    def __init__(self):
        super().__init__()
        self.setWindowTitle("RPG Master App (Pathfinder 2e)")
        self.setGeometry(100, 100, 1000, 600)
        self.updating_table = False
        self.updating_combat_table = False  # Flag para evitar recursão

        # Data storage
        self.data_file = str(Path.home() / "rpg_master_data.json")
        self.load_data()

        # Main widget and layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.layout = QVBoxLayout(self.central_widget)

        # Tabs
        self.tabs = QTabWidget()
        self.layout.addWidget(self.tabs)

        # Entity Management Tab
        self.entity_widget = QWidget()
        self.entity_layout = QVBoxLayout(self.entity_widget)
        self.setup_entity_tab()
        self.tabs.addTab(self.entity_widget, "Personagens")

        # Ship Tab (nova aba)
        self.ship_tab_widget = QWidget()
        self.ship_tab_layout = QVBoxLayout(self.ship_tab_widget)
        self.setup_ship_tab()
        self.ship_tab_widget.setLayout(self.ship_tab_layout)
        self.tabs.addTab(self.ship_tab_widget, "Embarcação")

        # Crew Tab (nova aba)
        self.crew_tab_widget = QWidget()
        self.crew_tab_layout = QVBoxLayout(self.crew_tab_widget)
        # Formulário de cadastro de tripulante
        crew_form_widget = QWidget()
        crew_form_layout = QFormLayout()
        self.crew_name = QLineEdit()
        self.crew_role = QLineEdit()
        self.crew_max_hp = QSpinBox()
        self.crew_max_hp.setRange(1, 9999)
        self.crew_max_hp.setValue(10)
        self.crew_info = QLineEdit()
        self.crew_actions = QLineEdit()
        crew_form_layout.addRow("Nome do Tripulante", self.crew_name)
        crew_form_layout.addRow("Função", self.crew_role)
        crew_form_layout.addRow("PV Máximo", self.crew_max_hp)
        crew_form_layout.addRow("Informações Extras", self.crew_info)
        crew_form_layout.addRow("Ações Extras", self.crew_actions)
        add_crew_btn = QPushButton("Adicionar Tripulante")
        add_crew_btn.clicked.connect(self.add_crew)
        crew_form_layout.addWidget(add_crew_btn)
        crew_form_widget.setLayout(crew_form_layout)
        self.crew_tab_layout.addWidget(crew_form_widget)
        # Tabela de tripulantes
        self.crew_table = QTableWidget()
        self.crew_table.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.crew_tab_layout.addWidget(self.crew_table)
        self.crew_tab_widget.setLayout(self.crew_tab_layout)
        self.tabs.addTab(self.crew_tab_widget, "Tripulação")
        self.update_crew_table()

        # Ship Combat Tab
        self.combat_widget = QWidget()
        self.combat_layout = QVBoxLayout(self.combat_widget)
        self.setup_combat_tab()
        self.tabs.addTab(self.combat_widget, "Combate Naval")

        # Notes Tab
        self.notes_widget = QWidget()
        self.notes_layout = QVBoxLayout(self.notes_widget)
        self.setup_notes_tab()
        self.tabs.addTab(self.notes_widget, "Notes")

        # Export/Import Buttons
        self.export_btn = QPushButton("Export Data")
        self.export_btn.clicked.connect(self.export_data)
        self.import_btn = QPushButton("Import Data")
        self.import_btn.clicked.connect(self.import_data)
        self.layout.addWidget(self.export_btn)
        self.layout.addWidget(self.import_btn)

        # Rodapé de autoria
        self.footer_label = QLabel("Feito pelo Mestre Paulo Godoy")
        self.footer_label.setAlignment(Qt.AlignCenter)
        self.layout.addWidget(self.footer_label)

    def load_data(self):
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
                self.entities = data.get('entities', [])
                self.ship = data.get('ship', {
                    'name': 'Default Ship', 'hp': 100, 'maxHp': 100, 'hardness': 0, 'speed': 30,
                    'abilities': [], 'crew': [], 'goods': ''
                })
                # Migração: se existir enemyShips antigo, ignora (removido do formato)
                # Se houver dados antigos de enemyShips, podem ser migrados para combatShips se necessário
                old_enemy_ships = data.get('enemyShips', [])
                if old_enemy_ships:
                    # Migração automática: converte enemyShips antigos para combatShips se não houver combatShips
                    if not data.get('combatShips'):
                        self.combat_ships = [{
                            'name': ship.get('name', 'Embarcação Inimiga'),
                            'initiative': 0,
                            'hp': ship.get('hp', ship.get('maxHp', 100)),
                            'maxHp': ship.get('maxHp', 100),
                            'hardness': ship.get('hardness', 0),
                            'speed': ship.get('speed', 30),
                            'abilities': []
                        } for ship in old_enemy_ships]
                    else:
                        self.combat_ships = data.get('combatShips', [])
                else:
                    self.combat_ships = data.get('combatShips', [])
                self.notes = data.get('notes', '')
                self.current_turn = data.get('currentTurn', 0)
                # Salva automaticamente após migração para remover enemyShips do arquivo
                if old_enemy_ships:
                    self.save_data()
        except (FileNotFoundError, json.JSONDecodeError):
            self.entities = []
            self.ship = {'name': 'Default Ship', 'hp': 100, 'maxHp': 100, 'hardness': 0, 'speed': 30, 'abilities': [], 'crew': [], 'goods': ''}
            self.combat_ships = []
            self.notes = ''
            self.current_turn = 0

    def save_data(self):
        data = {
            'entities': self.entities,
            'ship': self.ship,
            'combatShips': self.combat_ships,
            'notes': self.notes,
            'currentTurn': self.current_turn
        }
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)

    def setup_entity_tab(self):
        # Formulário simplificado para adicionar personagens
        form_widget = QWidget()
        form_layout = QFormLayout()
        self.entity_name = QLineEdit()
        from PyQt5.QtWidgets import QComboBox
        self.entity_type = QComboBox()
        self.entity_type.addItems(['PC', 'NPC', 'Monster'])
        self.entity_max_hp = QSpinBox()
        self.entity_max_hp.setRange(1, 9999)
        self.entity_initiative = QSpinBox()
        self.entity_initiative.setRange(0, 9999)
        self.entity_armor = QSpinBox()
        self.entity_armor.setRange(0, 9999)
        self.entity_conditions = QLineEdit()
        self.entity_abilities = QLineEdit()
        form_layout.addRow("Nome", self.entity_name)
        form_layout.addRow("Tipo", self.entity_type)
        form_layout.addRow("HP Máximo", self.entity_max_hp)
        form_layout.addRow("Iniciativa", self.entity_initiative)
        form_layout.addRow("Armadura", self.entity_armor)
        form_layout.addRow("Condições (separadas por vírgula)", self.entity_conditions)
        form_layout.addRow("Habilidades (separadas por vírgula)", self.entity_abilities)
        add_btn = QPushButton("Adicionar Personagem")
        add_btn.clicked.connect(self.add_entity)
        form_layout.addWidget(add_btn)
        form_widget.setLayout(form_layout)
        self.entity_layout.addWidget(form_widget)

        # Tabela simplificada de personagens
        self.entity_table = QTableWidget()
        self.entity_table.setColumnCount(5)
        self.entity_table.setHorizontalHeaderLabels(['Nome', 'Tipo', 'HP', 'Iniciativa', 'Ações'])
        self.entity_table.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.entity_layout.addWidget(self.entity_table)

        # Marcador de turno, contador e botão próximo turno
        turno_layout = QHBoxLayout()
        self.turn_counter = QLineEdit()
        self.turn_counter.setReadOnly(True)
        self.turn_counter.setFixedWidth(60)
        self.update_turn_counter()
        self.turn_marker = QLineEdit()
        self.turn_marker.setPlaceholderText("Informações do turno atual")
        self.turn_marker.textChanged.connect(self.save_turn_marker)
        self.next_turn_btn = QPushButton("Próximo Turno")
        self.next_turn_btn.clicked.connect(self.next_turn)
        turno_layout.addWidget(self.next_turn_btn)
        turno_layout.addWidget(self.turn_counter)
        turno_layout.addWidget(self.turn_marker)
        self.entity_layout.addLayout(turno_layout)
        self.update_turn_counter()

        self.update_entity_table()

    def add_entity(self):
        entity = {
            'id': len(self.entities),
            'name': self.entity_name.text(),
            'type': self.entity_type.currentText(),
            'maxHp': self.entity_max_hp.value(),
            'hp': self.entity_max_hp.value(),
            'initiative': self.entity_initiative.value(),
            'armor': self.entity_armor.value(),
            'conditions': [c.strip() for c in self.entity_conditions.text().split(',') if c.strip()],
            'abilities': [a.strip() for a in self.entity_abilities.text().split(',') if a.strip()]
        }
        self.entities.append(entity)
        self.entities.sort(key=lambda x: x['initiative'], reverse=True)
        self.update_entity_table()
        self.save_data()
        # Nunca limpar os campos do formulário automaticamente!
    # Proteção extra: nunca limpe os campos do formulário fora de add_entity
    def clear_entity_form(self):
        print('Tentativa de limpar campos do formulário FORA de add_entity!')
        # Não faz nada

    def update_entity_table(self):
        self.entity_table.setColumnCount(8)
        self.entity_table.setHorizontalHeaderLabels(['Nome', 'Tipo', 'Pontos de Vida', 'Iniciativa', 'Armadura', 'Condições', 'Habilidades', 'Ações'])
        self.entity_table.setRowCount(len(self.entities))
        self.updating_table = True
        for row, entity in enumerate(self.entities):
            self.entity_table.setItem(row, 0, QTableWidgetItem(entity['name']))
            self.entity_table.setItem(row, 1, QTableWidgetItem(entity['type']))
            # HP editável (campo 2)
            hp_item = QTableWidgetItem(f"{entity['hp']}/{entity['maxHp']}")
            hp_item.setFlags(hp_item.flags() | Qt.ItemIsEditable)
            self.entity_table.setItem(row, 2, hp_item)
            # Iniciativa editável (campo 3)
            initiative_item = QTableWidgetItem(str(entity['initiative']))
            initiative_item.setFlags(initiative_item.flags() | Qt.ItemIsEditable)
            self.entity_table.setItem(row, 3, initiative_item)
            # Armadura editável (campo 4)
            armor_item = QTableWidgetItem(str(entity.get('armor', 0)))
            armor_item.setFlags(armor_item.flags() | Qt.ItemIsEditable)
            self.entity_table.setItem(row, 4, armor_item)
            # Condições editável (campo 5)
            cond_item = QTableWidgetItem(', '.join(entity.get('conditions', [])))
            cond_item.setFlags(cond_item.flags() | Qt.ItemIsEditable)
            self.entity_table.setItem(row, 5, cond_item)
            # Habilidades editável (campo 6)
            abil_item = QTableWidgetItem(', '.join(entity.get('abilities', [])))
            abil_item.setFlags(abil_item.flags() | Qt.ItemIsEditable)
            self.entity_table.setItem(row, 6, abil_item)
            actions_widget = QWidget()
            actions_layout = QHBoxLayout(actions_widget)
            actions_layout.setContentsMargins(0, 0, 0, 0)
            actions_layout.setSpacing(5)
            damage_input = QSpinBox()
            damage_input.setRange(0, 9999)
            damage_input.setFixedWidth(80)
            damage_input.setAlignment(Qt.AlignRight)
            damage_input.setStyleSheet("QSpinBox { font-size: 12px; }")
            damage_btn = QPushButton("Dano")
            damage_btn.setMinimumWidth(70)
            damage_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            def damage_clicked(_, r=row, spin=damage_input):
                self.apply_damage(r, spin.value())
            damage_btn.clicked.connect(damage_clicked)
            heal_input = QSpinBox()
            heal_input.setRange(0, 9999)
            heal_input.setFixedWidth(80)
            heal_input.setAlignment(Qt.AlignRight)
            heal_input.setStyleSheet("QSpinBox { font-size: 12px; }")
            heal_btn = QPushButton("Curar")
            heal_btn.setMinimumWidth(70)
            heal_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            def heal_clicked(_, r=row, spin=heal_input):
                self.apply_heal(r, spin.value())
            heal_btn.clicked.connect(heal_clicked)
            remove_btn = QPushButton("Remover")
            remove_btn.setMinimumWidth(70)
            remove_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            remove_btn.clicked.connect(lambda _, r=row: self.confirm_remove_entity(r))
            actions_layout.addWidget(damage_input)
            actions_layout.addWidget(damage_btn)
            actions_layout.addWidget(heal_input)
            actions_layout.addWidget(heal_btn)
            actions_layout.addWidget(remove_btn)
            self.entity_table.setCellWidget(row, 7, actions_widget)
            # Destacar o personagem do turno atual
            if row == self.current_turn:
                for col in range(7):
                    item = self.entity_table.item(row, col)
                    if item:
                        item.setBackground(Qt.yellow)
                # Atualizar caixa de informações do turno com o texto salvo
                self.turn_marker.blockSignals(True)
                self.turn_marker.setText(entity.get('turn_info', ''))
                self.turn_marker.blockSignals(False)
        # Ajustar visualização da coluna de ações
        header = self.entity_table.horizontalHeader()
        from PyQt5.QtWidgets import QHeaderView
        for i in range(7):
            header.setSectionResizeMode(i, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(7, QHeaderView.Stretch)
        self.entity_table.verticalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        # Evitar múltiplas conexões e loops infinitos
        try:
            self.entity_table.itemChanged.disconnect(self.handle_initiative_edit)
        except Exception:
            pass
        self.entity_table.itemChanged.connect(self.handle_initiative_edit)
        self.updating_table = False
        # Nunca alterar os campos do formulário de cadastro aqui!
    def handle_initiative_edit(self, item):
        if self.updating_table:
            return
        row = item.row()
        col = item.column()
        if col == 2:
            # HP editado: espera formato "hp/maxHp" ou só "hp"
            hp_text = item.text().split('/')[0].strip()
            try:
                new_hp = int(hp_text)
            except ValueError:
                return
            self.entities[row]['hp'] = max(0, min(self.entities[row]['maxHp'], new_hp))
        elif col == 3:
            try:
                new_value = int(item.text())
            except ValueError:
                return
            self.entities[row]['initiative'] = new_value
            self.entities.sort(key=lambda x: x['initiative'], reverse=True)
        elif col == 4:
            try:
                new_armor = int(item.text())
            except ValueError:
                return
            self.entities[row]['armor'] = new_armor
        elif col == 5:
            conds = [c.strip() for c in item.text().split(',') if c.strip()]
            self.entities[row]['conditions'] = conds
        elif col == 6:
            abils = [a.strip() for a in item.text().split(',') if a.strip()]
            self.entities[row]['abilities'] = abils
        self.save_data()
        self.update_entity_table()
    def save_turn_marker(self):
        # Salva o texto da caixa de informações no personagem do turno atual
        if self.entities and 0 <= self.current_turn < len(self.entities):
            self.entities[self.current_turn]['turn_info'] = self.turn_marker.text()
            self.save_data()

        # Ajuste automático das colunas
        header = self.entity_table.horizontalHeader()
        from PyQt5.QtWidgets import QHeaderView
        for i in range(7):
            header.setSectionResizeMode(i, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(7, QHeaderView.Stretch)
        self.entity_table.verticalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)

    def confirm_remove_entity(self, row):
        from PyQt5.QtWidgets import QMessageBox
        reply = QMessageBox.question(self, 'Remover Personagem',
                                     f'Tem certeza que deseja remover o personagem "{self.entities[row]["name"]}"?',
                                     QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if reply == QMessageBox.Yes:
            self.remove_entity(row)

    def remove_entity(self, row):
        self.entities.pop(row)
        # Corrigir bug: não fechar o app ao remover o último personagem
        if not self.entities:
            self.current_turn = 0
        else:
            self.current_turn = self.current_turn % len(self.entities)
        self.update_entity_table()
        self.save_data()

    def apply_damage(self, row, damage):
        entity = self.entities[row]
        new_hp = max(0, entity['hp'] - damage)
        entity['hp'] = new_hp
        self.update_entity_table()
        self.save_data()

    def apply_heal(self, row, heal):
        entity = self.entities[row]
        new_hp = min(entity['maxHp'], entity['hp'] + heal)
        entity['hp'] = new_hp
        self.update_entity_table()
        self.save_data()

    # Removidos: add_condition/use_item/use_spell_slot/use_focus_point
    # Motivo: eram código “morto” nesta UI e dependiam de chaves inexistentes (statusEffects, inventory, etc.).

    def next_turn(self):
        if self.entities:
            # Organizar pela iniciativa antes de avançar o turno
            self.entities.sort(key=lambda x: x['initiative'], reverse=True)
            self.current_turn = (self.current_turn + 1) % len(self.entities)
            self.update_entity_table()
            self.save_data()
            self.update_turn_counter()

    def update_turn_counter(self):
        if self.entities:
            self.turn_counter.setText(f"{self.current_turn + 1}/{len(self.entities)}")
        else:
            self.turn_counter.setText("0/0")

    def setup_ship_tab(self):
        form_widget = QWidget()
        form_layout = QFormLayout()
        self.ship_name = QLineEdit(self.ship['name'])
        self.ship_max_hp = QSpinBox()
        self.ship_max_hp.setRange(1, 1000)
        self.ship_max_hp.setValue(self.ship['maxHp'])
        self.ship_hp = QSpinBox()
        self.ship_hp.setRange(0, 1000)
        self.ship_hp.setValue(self.ship['hp'])
        self.ship_hardness = QSpinBox()
        self.ship_hardness.setRange(0, 100)
        self.ship_hardness.setValue(self.ship['hardness'])
        self.ship_speed = QSpinBox()
        self.ship_speed.setValue(self.ship['speed'])
        self.ship_abilities = QTextEdit('\n'.join(self.ship['abilities']))
        self.ship_abilities.setReadOnly(False)
        self.ship_goods = QLineEdit(self.ship.get('goods', ''))
        form_layout.addRow("Nome da Embarcação", self.ship_name)
        form_layout.addRow("PV Máximo", self.ship_max_hp)
        form_layout.addRow("PV Atual", self.ship_hp)
        form_layout.addRow("Resistência", self.ship_hardness)
        form_layout.addRow("Velocidade", self.ship_speed)
        form_layout.addRow("Habilidades", self.ship_abilities)
        form_layout.addRow("Mercadorias", self.ship_goods)
        save_ship_btn = QPushButton("Salvar Embarcação")
        save_ship_btn.clicked.connect(self.save_ship)
        form_layout.addWidget(save_ship_btn)
        form_widget.setLayout(form_layout)
        self.ship_tab_layout.addWidget(form_widget)

        # Tabela de embarcações (apenas uma por enquanto)
        self.ship_table = QTableWidget()
        self.ship_table.setColumnCount(8)
        self.ship_table.setHorizontalHeaderLabels(['Nome', 'PV', 'PV Máx', 'Resistência', 'Velocidade', 'Mercadorias', 'Dano/Reparo', 'Ações'])
        self.ship_table.setRowCount(1)
        self.update_ship_table()
        from PyQt5.QtWidgets import QHeaderView
        for i in range(7):
            self.ship_table.horizontalHeader().setSectionResizeMode(i, QHeaderView.Stretch)
        self.ship_table.horizontalHeader().setSectionResizeMode(7, QHeaderView.ResizeToContents)
        self.ship_table.verticalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        self.ship_table.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.ship_tab_layout.addWidget(self.ship_table)

    def update_ship_table(self):
        self.ship_table.setRowCount(1)
        # Nome editável
        name_item = QTableWidgetItem(self.ship.get('name', ''))
        name_item.setFlags(name_item.flags() | Qt.ItemIsEditable)
        self.ship_table.setItem(0, 0, name_item)
        # PV atual editável
        hp_item = QTableWidgetItem(str(self.ship.get('hp', 0)))
        hp_item.setFlags(hp_item.flags() | Qt.ItemIsEditable)
        self.ship_table.setItem(0, 1, hp_item)
        # PV máximo editável
        maxhp_item = QTableWidgetItem(str(self.ship.get('maxHp', 0)))
        maxhp_item.setFlags(maxhp_item.flags() | Qt.ItemIsEditable)
        self.ship_table.setItem(0, 2, maxhp_item)
        # Resistência editável
        hard_item = QTableWidgetItem(str(self.ship.get('hardness', 0)))
        hard_item.setFlags(hard_item.flags() | Qt.ItemIsEditable)
        self.ship_table.setItem(0, 3, hard_item)
        # Velocidade editável
        speed_item = QTableWidgetItem(str(self.ship.get('speed', 0)))
        speed_item.setFlags(speed_item.flags() | Qt.ItemIsEditable)
        self.ship_table.setItem(0, 4, speed_item)
        # Mercadorias editável
        goods_item = QTableWidgetItem(self.ship.get('goods', ''))
        goods_item.setFlags(goods_item.flags() | Qt.ItemIsEditable)
        self.ship_table.setItem(0, 5, goods_item)
        # Campo de dano/reparo
        damage_widget = QWidget()
        damage_layout = QHBoxLayout()
        damage_layout.setContentsMargins(0, 0, 0, 0)
        damage_layout.setSpacing(5)
        damage_input = QSpinBox()
        damage_input.setRange(0, 9999)
        damage_input.setFixedWidth(80)
        damage_input.setAlignment(Qt.AlignRight)
        damage_input.setStyleSheet("QSpinBox { font-size: 12px; }")
        damage_btn = QPushButton("Dano")
        damage_btn.setMinimumWidth(70)
        damage_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        damage_btn.clicked.connect(lambda _, spin=damage_input: self.apply_ship_damage(spin.value()))
        repair_input = QSpinBox()
        repair_input.setRange(0, 9999)
        repair_input.setFixedWidth(80)
        repair_input.setAlignment(Qt.AlignRight)
        repair_input.setStyleSheet("QSpinBox { font-size: 12px; }")
        repair_btn = QPushButton("Reparar")
        repair_btn.setMinimumWidth(70)
        repair_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        repair_btn.clicked.connect(lambda _, spin=repair_input: self.apply_ship_repair(spin.value()))
        damage_layout.addWidget(damage_input)
        damage_layout.addWidget(damage_btn)
        damage_layout.addWidget(repair_input)
        damage_layout.addWidget(repair_btn)
        damage_widget.setLayout(damage_layout)
        self.ship_table.setCellWidget(0, 6, damage_widget)
        # Botão de ação
        actions_widget = QWidget()
        actions_layout = QHBoxLayout()
        actions_layout.setContentsMargins(0, 0, 0, 0)
        actions_layout.setSpacing(5)
        save_btn = QPushButton("Salvar")
        save_btn.setMinimumWidth(70)
        save_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        save_btn.clicked.connect(self.save_ship_from_table)
        actions_layout.addWidget(save_btn)
        actions_widget.setLayout(actions_layout)
        self.ship_table.setCellWidget(0, 7, actions_widget)
        self.ship_table.resizeColumnsToContents()

    def apply_ship_damage(self, damage):
        self.ship['hp'] = max(0, self.ship['hp'] - damage)
        self.save_data()
        self.update_ship_table()

    def apply_ship_repair(self, repair):
        self.ship['hp'] = min(self.ship['maxHp'], self.ship['hp'] + repair)
        self.save_data()
        self.update_ship_table()

    def save_ship_from_table(self):
        self.ship['name'] = self.ship_table.item(0, 0).text()
        try:
            self.ship['hp'] = int(self.ship_table.item(0, 1).text())
            self.ship['maxHp'] = int(self.ship_table.item(0, 2).text())
            self.ship['hardness'] = int(self.ship_table.item(0, 3).text())
            self.ship['speed'] = int(self.ship_table.item(0, 4).text())
            self.ship['goods'] = self.ship_table.item(0, 5).text()
        except Exception:
            pass
        self.save_data()
        self.update_ship_table()

    def save_ship(self):
        self.ship['name'] = self.ship_name.text()
        self.ship['maxHp'] = self.ship_max_hp.value()
        self.ship['hp'] = self.ship_hp.value()
        self.ship['hardness'] = self.ship_hardness.value()
        self.ship['speed'] = self.ship_speed.value()
        self.ship['abilities'] = self.ship_abilities.toPlainText().splitlines()
        self.ship['goods'] = self.ship_goods.text()
        self.save_data()
        self.update_ship_table()

    # Removido: add_ship_ability (não existe campo `self.ship_ability` nesta versão da UI).

    def add_crew(self):
        crew = {
            'id': len(self.ship['crew']),
            'name': self.crew_name.text(),
            'role': self.crew_role.text(),
            'maxHp': self.crew_max_hp.value(),
            'hp': self.crew_max_hp.value(),
            'info': self.crew_info.text(),
            'actions': self.crew_actions.text()
        }
        self.ship['crew'].append(crew)
        self.update_crew_table()
        self.save_data()
        self.crew_name.clear()
        self.crew_role.clear()
        self.crew_max_hp.setValue(10)
        self.crew_info.clear()
        self.crew_actions.clear()

    def update_crew_table(self):
        # Evitar múltiplas conexões e loops infinitos
        try:
            self.crew_table.itemChanged.disconnect(self.handle_crew_edit)
        except Exception:
            pass
        self.crew_table.itemChanged.connect(self.handle_crew_edit)
        self.crew_table.setColumnCount(6)
        self.crew_table.setHorizontalHeaderLabels(['Tripulante', 'Função', 'Pontos de Vida', 'Informações Extras', 'Ações Extras', 'Ações'])
        self.crew_table.setRowCount(len(self.ship['crew']))
        self.updating_table = True
        for row, crew in enumerate(self.ship['crew']):
            # Nome editável
            name_item = QTableWidgetItem(crew.get('name', ''))
            name_item.setFlags(name_item.flags() | Qt.ItemIsEditable)
            self.crew_table.setItem(row, 0, name_item)
            # Função editável
            role_item = QTableWidgetItem(crew.get('role', ''))
            role_item.setFlags(role_item.flags() | Qt.ItemIsEditable)
            self.crew_table.setItem(row, 1, role_item)
            # PV editável
            hp_item = QTableWidgetItem(f"{crew.get('hp', 0)}/{crew.get('maxHp', 0)}")
            hp_item.setFlags(hp_item.flags() | Qt.ItemIsEditable)
            self.crew_table.setItem(row, 2, hp_item)
            # Informações Extras editável
            info_item = QTableWidgetItem(crew.get('info', ''))
            info_item.setFlags(info_item.flags() | Qt.ItemIsEditable)
            self.crew_table.setItem(row, 3, info_item)
            # Ações Extras editável
            actions_item = QTableWidgetItem(crew.get('actions', ''))
            actions_item.setFlags(actions_item.flags() | Qt.ItemIsEditable)
            self.crew_table.setItem(row, 4, actions_item)
            # Botões de ação
            actions_widget = QWidget()
            actions_layout = QHBoxLayout(actions_widget)
            actions_layout.setContentsMargins(0, 0, 0, 0)
            actions_layout.setSpacing(5)
            damage_input = QSpinBox()
            damage_input.setRange(0, 9999)
            damage_input.setFixedWidth(80)
            damage_input.setAlignment(Qt.AlignRight)
            damage_input.setStyleSheet("QSpinBox { font-size: 12px; }")
            damage_btn = QPushButton("Dano")
            damage_btn.setMinimumWidth(70)
            damage_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            def damage_clicked(_, r=row, spin=damage_input):
                self.apply_crew_damage(r, spin.value())
            damage_btn.clicked.connect(damage_clicked)
            heal_input = QSpinBox()
            heal_input.setRange(0, 9999)
            heal_input.setFixedWidth(80)
            heal_input.setAlignment(Qt.AlignRight)
            heal_input.setStyleSheet("QSpinBox { font-size: 12px; }")
            heal_btn = QPushButton("Curar")
            heal_btn.setMinimumWidth(70)
            heal_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            def heal_clicked(_, r=row, spin=heal_input):
                self.apply_crew_heal(r, spin.value())
            heal_btn.clicked.connect(heal_clicked)
            remove_btn = QPushButton("Remover")
            remove_btn.setMinimumWidth(70)
            remove_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            remove_btn.clicked.connect(lambda _, r=row: self.confirm_remove_crew(r))
            actions_layout.addWidget(damage_input)
            actions_layout.addWidget(damage_btn)
            actions_layout.addWidget(heal_input)
            actions_layout.addWidget(heal_btn)
            actions_layout.addWidget(remove_btn)
            self.crew_table.setCellWidget(row, 5, actions_widget)
        self.crew_table.resizeColumnsToContents()
        self.updating_table = False
    def handle_crew_edit(self, item):
        if self.updating_table:
            return
        row = item.row()
        col = item.column()
        crew = self.ship['crew'][row]
        if col == 0:
            crew['name'] = item.text()
        elif col == 1:
            crew['role'] = item.text()
        elif col == 2:
            hp_text = item.text().split('/')[0].strip()
            try:
                new_hp = int(hp_text)
            except ValueError:
                return
            crew['hp'] = max(0, min(crew['maxHp'], new_hp))
        elif col == 3:
            crew['info'] = item.text()
        elif col == 4:
            crew['actions'] = item.text()
        self.save_data()
        self.update_crew_table()

    def apply_crew_damage(self, row, damage):
        crew = self.ship['crew'][row]
        crew['hp'] = max(0, crew['hp'] - damage)
        self.update_crew_table()
        self.save_data()

    def setup_combat_tab(self):
        form_widget = QWidget()
        form_layout = QFormLayout()
        self.combat_ship_name = QLineEdit()
        self.combat_ship_initiative = QSpinBox()
        self.combat_ship_initiative.setRange(0, 9999)
        self.combat_ship_max_hp = QSpinBox()
        self.combat_ship_max_hp.setRange(1, 1000)
        self.combat_ship_max_hp.setValue(100)
        self.combat_ship_hp = QSpinBox()
        self.combat_ship_hp.setRange(0, 1000)
        self.combat_ship_hp.setValue(100)
        self.combat_ship_hardness = QSpinBox()
        self.combat_ship_hardness.setRange(0, 100)
        self.combat_ship_hardness.setValue(0)
        self.combat_ship_speed = QSpinBox()
        self.combat_ship_speed.setRange(0, 100)
        self.combat_ship_speed.setValue(30)
        self.combat_ship_abilities = QLineEdit()
        form_layout.addRow("Nome", self.combat_ship_name)
        form_layout.addRow("Iniciativa", self.combat_ship_initiative)
        form_layout.addRow("PV Máximo", self.combat_ship_max_hp)
        form_layout.addRow("PV Atual", self.combat_ship_hp)
        form_layout.addRow("Resistência", self.combat_ship_hardness)
        form_layout.addRow("Velocidade", self.combat_ship_speed)
        form_layout.addRow("Habilidades (separadas por vírgula)", self.combat_ship_abilities)
        add_combat_ship_btn = QPushButton("Adicionar Embarcação ao Combate")
        add_combat_ship_btn.clicked.connect(self.add_combat_ship)
        form_layout.addWidget(add_combat_ship_btn)
        form_widget.setLayout(form_layout)
        self.combat_layout.addWidget(form_widget)

        # Tabela de combate naval
        self.combat_ship_table = QTableWidget()
        self.combat_ship_table.setColumnCount(8)
        self.combat_ship_table.setHorizontalHeaderLabels([
            'Nome', 'Iniciativa', 'PV', 'PV Máx', 'Resistência', 'Velocidade', 'Habilidades', 'Ações'
        ])
        self.combat_ship_table.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.combat_layout.addWidget(self.combat_ship_table)
        self.combat_ships = []  # Lista de embarcações em combate
        self.combat_ship_table.itemChanged.connect(self.handle_combat_ship_edit)
        self.update_combat_ship_table()

    def add_combat_ship(self):
        ship_data = {
            'name': self.combat_ship_name.text(),
            'initiative': self.combat_ship_initiative.value(),
            'hp': self.combat_ship_hp.value(),
            'maxHp': self.combat_ship_max_hp.value(),
            'hardness': self.combat_ship_hardness.value(),
            'speed': self.combat_ship_speed.value(),
            'abilities': [a.strip() for a in self.combat_ship_abilities.text().split(',') if a.strip()]
        }
        # Proteção: não adicionar embarcação sem nome
        if not ship_data['name']:
            return
        self.combat_ships.append(ship_data)
        self.update_combat_ship_table()
        self.save_data()
        # Não limpar os campos do formulário automaticamente!
        # Se quiser limpar, faça manualmente.

    def update_combat_ship_table(self):
        self.updating_combat_table = True
        self.combat_ship_table.setRowCount(len(self.combat_ships))
        for row, ship in enumerate(self.combat_ships):
            # Nome
            name_item = QTableWidgetItem(ship['name'])
            name_item.setFlags(name_item.flags() & ~Qt.ItemIsEditable)
            self.combat_ship_table.setItem(row, 0, name_item)
            # Iniciativa editável
            initiative_item = QTableWidgetItem(str(ship.get('initiative', 0)))
            initiative_item.setFlags(initiative_item.flags() | Qt.ItemIsEditable)
            self.combat_ship_table.setItem(row, 1, initiative_item)
            # PV atual editável
            hp_item = QTableWidgetItem(str(ship.get('hp', 0)))
            hp_item.setFlags(hp_item.flags() | Qt.ItemIsEditable)
            self.combat_ship_table.setItem(row, 2, hp_item)
            # PV máximo
            maxhp_item = QTableWidgetItem(str(ship.get('maxHp', 0)))
            maxhp_item.setFlags(maxhp_item.flags() & ~Qt.ItemIsEditable)
            self.combat_ship_table.setItem(row, 3, maxhp_item)
            # Resistência
            hard_item = QTableWidgetItem(str(ship.get('hardness', 0)))
            hard_item.setFlags(hard_item.flags() & ~Qt.ItemIsEditable)
            self.combat_ship_table.setItem(row, 4, hard_item)
            # Velocidade
            speed_item = QTableWidgetItem(str(ship.get('speed', 0)))
            speed_item.setFlags(speed_item.flags() & ~Qt.ItemIsEditable)
            self.combat_ship_table.setItem(row, 5, speed_item)
            # Habilidades
            abilities_item = QTableWidgetItem(', '.join(ship.get('abilities', [])))
            abilities_item.setFlags(abilities_item.flags() & ~Qt.ItemIsEditable)
            self.combat_ship_table.setItem(row, 6, abilities_item)
            # Botões de ação: dano/reparo
            actions_widget = QWidget()
            actions_layout = QHBoxLayout(actions_widget)
            actions_layout.setContentsMargins(0, 0, 0, 0)
            actions_layout.setSpacing(5)
            damage_input = QSpinBox()
            damage_input.setRange(0, 9999)
            damage_input.setFixedWidth(80)
            damage_input.setAlignment(Qt.AlignRight)
            damage_input.setStyleSheet("QSpinBox { font-size: 12px; }")
            damage_btn = QPushButton("Dano")
            damage_btn.setMinimumWidth(70)
            damage_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            damage_btn.clicked.connect(lambda _, r=row, spin=damage_input: self.apply_combat_ship_damage(r, spin.value()))
            repair_input = QSpinBox()
            repair_input.setRange(0, 9999)
            repair_input.setFixedWidth(80)
            repair_input.setAlignment(Qt.AlignRight)
            repair_input.setStyleSheet("QSpinBox { font-size: 12px; }")
            repair_btn = QPushButton("Reparar")
            repair_btn.setMinimumWidth(70)
            repair_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            repair_btn.clicked.connect(lambda _, r=row, spin=repair_input: self.apply_combat_ship_repair(r, spin.value()))
            actions_layout.addWidget(damage_input)
            actions_layout.addWidget(damage_btn)
            actions_layout.addWidget(repair_input)
            actions_layout.addWidget(repair_btn)
            actions_widget.setLayout(actions_layout)
            self.combat_ship_table.setCellWidget(row, 7, actions_widget)
        self.combat_ship_table.resizeColumnsToContents()
        self.updating_combat_table = False

    def apply_combat_ship_damage(self, row, damage):
        ship = self.combat_ships[row]
        ship['hp'] = max(0, ship['hp'] - damage)
        self.update_combat_ship_table()
        self.save_data()

    def apply_combat_ship_repair(self, row, repair):
        ship = self.combat_ships[row]
        ship['hp'] = min(ship['maxHp'], ship['hp'] + repair)
        self.update_combat_ship_table()
        self.save_data()

    def handle_combat_ship_edit(self, item):
        if getattr(self, 'updating_combat_table', False):
            return
        row = item.row()
        col = item.column()
        ship = self.combat_ships[row]
        if col == 1:
            # Iniciativa
            try:
                ship['initiative'] = int(item.text())
            except ValueError:
                pass
        elif col == 2:
            # PV atual
            try:
                new_hp = int(item.text())
            except ValueError:
                return
            ship['hp'] = max(0, min(ship['maxHp'], new_hp))
        self.update_combat_ship_table()
        self.save_data()

    def setup_notes_tab(self):
        self.notes_text = QTextEdit(self.notes)
        self.notes_text.textChanged.connect(self.update_notes)
        self.notes_layout.addWidget(self.notes_text)

    def update_notes(self):
        self.notes = self.notes_text.toPlainText()
        self.save_data()

    def export_data(self):
        file_name, _ = QFileDialog.getSaveFileName(self, "Export Data", "", "JSON Files (*.json)")
        if file_name:
            with open(file_name, 'w') as f:
                json.dump({
                    'entities': self.entities,
                    'ship': self.ship,
                    'combatShips': self.combat_ships,
                    'notes': self.notes,
                    'currentTurn': self.current_turn
                }, f, indent=2)

    def import_data(self):
        file_name, _ = QFileDialog.getOpenFileName(self, "Import Data", "", "JSON Files (*.json)")
        if file_name:
            with open(file_name, 'r') as f:
                data = json.load(f)
                self.entities = data.get('entities', [])
                self.ship = data.get('ship', self.ship)
                # Migração: se existir enemyShips antigo, migra para combatShips
                old_enemy_ships = data.get('enemyShips', [])
                if old_enemy_ships and not data.get('combatShips'):
                    self.combat_ships = [{
                        'name': ship.get('name', 'Embarcação Inimiga'),
                        'initiative': 0,
                        'hp': ship.get('hp', ship.get('maxHp', 100)),
                        'maxHp': ship.get('maxHp', 100),
                        'hardness': ship.get('hardness', 0),
                        'speed': ship.get('speed', 30),
                        'abilities': []
                    } for ship in old_enemy_ships]
                else:
                    self.combat_ships = data.get('combatShips', [])
                self.notes = data.get('notes', '')
                self.current_turn = data.get('currentTurn', 0)
                self.update_entity_table()
                self.update_crew_table()
                self.update_combat_ship_table()
                self.notes_text.setText(self.notes)
                self.ship_name.setText(self.ship['name'])
                self.ship_max_hp.setValue(self.ship['maxHp'])
                self.ship_hp.setValue(self.ship['hp'])
                self.ship_hardness.setValue(self.ship['hardness'])
                self.ship_speed.setValue(self.ship['speed'])
                self.ship_abilities.setText('\n'.join(self.ship['abilities']))
                self.save_data()


def main():
    app = QApplication(sys.argv)
    # Definir fonte padrão menor para toda a aplicação
    font = QFont()
    font.setPointSize(9)
    app.setFont(font)
    window = RPGMasterApp()
    window.show()
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()