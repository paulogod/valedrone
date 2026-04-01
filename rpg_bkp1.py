import sys
import json
from pathlib import Path
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QFormLayout,
                             QLineEdit, QSpinBox, QComboBox, QPushButton, QTableWidget, QTableWidgetItem,
                             QTextEdit, QFileDialog, QTabWidget, QSizePolicy)
from PyQt5.QtCore import Qt

# Pathfinder 2e conditions
CONDITIONS = [
    {"name": "Clumsy 1", "description": "Take a -1 status penalty to Dexterity-based checks and DCs, including AC, Reflex saves, and attack rolls."},
    {"name": "Drained 1", "description": "Take a -1 status penalty to Constitution-based checks and DCs. Lose HP equal to level; max HP reduced by same amount."},
    {"name": "Frightened 1", "description": "Take a -1 status penalty to all checks and DCs. Reduces by 1 at the end of your turn."},
    {"name": "Sickened 1", "description": "Take a -1 status penalty to all checks and DCs. Cannot willingly ingest anything. Attempt a Fortitude save to recover."},
    {"name": "Stunned 1", "description": "Lose actions on your next turn equal to the value. Cannot act if all actions are lost."}
]

class RPGMasterApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.updating_table = False
    def __init__(self):
        super().__init__()
        self.setWindowTitle("RPG Master App (Pathfinder 2e)")
        self.setGeometry(100, 100, 1000, 600)

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

        # Ship Management Tab
        self.ship_widget = QWidget()
        self.ship_layout = QVBoxLayout(self.ship_widget)
        self.setup_ship_tab()
        self.tabs.addTab(self.ship_widget, "Embarcação")

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
        from PyQt5.QtWidgets import QLabel
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
                    'abilities': [], 'crew': []
                })
                self.enemy_ships = data.get('enemyShips', [])
                self.notes = data.get('notes', '')
                self.current_turn = data.get('currentTurn', 0)
        except (FileNotFoundError, json.JSONDecodeError):
            self.entities = []
            self.ship = {'name': 'Default Ship', 'hp': 100, 'maxHp': 100, 'hardness': 0, 'speed': 30, 'abilities': [], 'crew': []}
            self.enemy_ships = []
            self.notes = ''
            self.current_turn = 0

    def save_data(self):
        data = {
            'entities': self.entities,
            'ship': self.ship,
            'enemyShips': self.enemy_ships,
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
            damage_input.setFixedWidth(70)
            damage_btn = QPushButton("Dano")
            damage_btn.setMinimumWidth(70)
            damage_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            def damage_clicked(_, r=row, spin=damage_input):
                self.apply_damage(r, spin.value())
            damage_btn.clicked.connect(damage_clicked)
            heal_input = QSpinBox()
            heal_input.setRange(0, 9999)
            heal_input.setFixedWidth(70)
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

    def add_condition(self, row, condition):
        if condition != "Add Condition":
            entity = self.entities[row]
            if condition not in entity['statusEffects']:
                entity['statusEffects'].append(condition)
                self.update_entity_table()
                self.save_data()

    def use_item(self, row, item):
        if item != "Use Item":
            entity = self.entities[row]
            for i in entity['inventory']:
                if i['name'] == item:
                    i['consumable'] = True
            self.update_entity_table()
            self.save_data()

    def use_spell_slot(self, row, level):
        entity = self.entities[row]
        slot = entity['spellSlots'][level]
        if slot['used'] < slot['total']:
            slot['used'] += 1
            self.update_entity_table()
            self.save_data()

    def use_focus_point(self, row):
        entity = self.entities[row]
        if entity['focusPoints']['used'] < entity['focusPoints']['total']:
            entity['focusPoints']['used'] += 1
            self.update_entity_table()
            self.save_data()

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
        self.ship_hp = QSpinBox()
        self.ship_hp.setRange(0, 1000)
        self.ship_hp.setValue(self.ship['hp'])
        self.ship_hardness = QSpinBox()
        self.ship_hardness.setRange(0, 100)
        self.ship_hardness.setValue(self.ship['hardness'])
        self.ship_speed = QSpinBox()
        self.ship_speed.setValue(self.ship['speed'])
        self.ship_ability = QLineEdit()
        add_ability_btn = QPushButton("Add Ability")
        add_ability_btn.clicked.connect(self.add_ship_ability)
        form_layout.addRow("Nome da Embarcação", self.ship_name)
        form_layout.addRow("PV Máximo", self.ship_max_hp)
        form_layout.addRow("PV Atual", self.ship_hp)
        form_layout.addRow("Resistência", self.ship_hardness)
        form_layout.addRow("Velocidade", self.ship_speed)
        form_layout.addRow("Habilidade", self.ship_ability)
        form_layout.addWidget(add_ability_btn)
        form_widget.setLayout(form_layout)
        self.ship_layout.addWidget(form_widget)

        # Crew form
        crew_form_widget = QWidget()
        crew_form_layout = QFormLayout()
        self.crew_name = QLineEdit()
        self.crew_role = QLineEdit()
        self.crew_max_hp = QSpinBox()
        self.crew_max_hp.setRange(1, 1000)
        self.crew_info = QLineEdit()
        self.crew_actions = QLineEdit()
        add_crew_btn = QPushButton("Adicionar Tripulante")
        add_crew_btn.clicked.connect(self.add_crew)
        crew_form_layout.addRow("Tripulante", self.crew_name)
        crew_form_layout.addRow("Função", self.crew_role)
        crew_form_layout.addRow("PV Máximo", self.crew_max_hp)
        crew_form_layout.addRow("Informações Extras", self.crew_info)
        crew_form_layout.addRow("Ações Extras", self.crew_actions)
        crew_form_layout.addWidget(add_crew_btn)
        crew_form_widget.setLayout(crew_form_layout)
        self.ship_layout.addWidget(crew_form_widget)

        # Abilities and crew display
        self.ship_abilities = QTextEdit('\n'.join(self.ship['abilities']))
        self.ship_abilities.setReadOnly(True)
        self.ship_layout.addWidget(self.ship_abilities)
        self.crew_table = QTableWidget()
        self.crew_table.setColumnCount(4)
        self.crew_table.setHorizontalHeaderLabels(['Nome', 'Função', 'Pontos de Vida', 'Ações'])
        self.ship_layout.addWidget(self.crew_table)
        self.update_crew_table()

    def add_ship_ability(self):
        ability = self.ship_ability.text().strip()
        if ability:
            self.ship['abilities'].append(ability)
            self.ship_abilities.setText('\n'.join(self.ship['abilities']))
            self.ship['name'] = self.ship_name.text()
            self.ship['maxHp'] = self.ship_max_hp.value()
            self.ship['hp'] = self.ship_hp.value()
            self.ship['hardness'] = self.ship_hardness.value()
            self.ship['speed'] = self.ship_speed.value()
            self.ship_ability.clear()
            self.save_data()

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
        self.crew_table.setColumnCount(6)
        self.crew_table.setHorizontalHeaderLabels(['Tripulante', 'Função', 'Pontos de Vida', 'Informações Extras', 'Ações Extras', 'Ações'])
        self.crew_table.setRowCount(len(self.ship['crew']))
        for row, crew in enumerate(self.ship['crew']):
            self.crew_table.setItem(row, 0, QTableWidgetItem(crew.get('name', '')))
            self.crew_table.setItem(row, 1, QTableWidgetItem(crew.get('role', '')))
            self.crew_table.setItem(row, 2, QTableWidgetItem(f"{crew.get('hp', 0)}/{crew.get('maxHp', 0)}"))
            self.crew_table.setItem(row, 3, QTableWidgetItem(crew.get('info', '')))
            self.crew_table.setItem(row, 4, QTableWidgetItem(crew.get('actions', '')))
            actions_widget = QWidget()
            actions_layout = QHBoxLayout()
            damage_input = QSpinBox()
            damage_input.setRange(0, 1000)
            damage_btn = QPushButton("Aplicar Dano")
            damage_btn.clicked.connect(lambda _, r=row: self.apply_crew_damage(r, damage_input.value()))
            actions_layout.addWidget(damage_input)
            actions_layout.addWidget(damage_btn)
            actions_widget.setLayout(actions_layout)
            self.crew_table.setCellWidget(row, 5, actions_widget)
        self.crew_table.resizeColumnsToContents()

    def apply_crew_damage(self, row, damage):
        crew = self.ship['crew'][row]
        crew['hp'] = max(0, crew['hp'] - damage)
        self.update_crew_table()
        self.save_data()

    def setup_combat_tab(self):
        form_widget = QWidget()
        form_layout = QFormLayout()
        self.enemy_ship_name = QLineEdit()
        self.enemy_ship_max_hp = QSpinBox()
        self.enemy_ship_max_hp.setRange(1, 1000)
        self.enemy_ship_hardness = QSpinBox()
        self.enemy_ship_hardness.setRange(0, 100)
        self.enemy_ship_speed = QSpinBox()
        self.enemy_ship_speed.setRange(0, 100)
        add_enemy_btn = QPushButton("Add Enemy Ship")
        add_enemy_btn.clicked.connect(self.add_enemy_ship)
        form_layout.addRow("Nome da Embarcação Inimiga", self.enemy_ship_name)
        form_layout.addRow("PV Máximo", self.enemy_ship_max_hp)
        form_layout.addRow("Resistência", self.enemy_ship_hardness)
        form_layout.addRow("Velocidade", self.enemy_ship_speed)
        form_layout.addWidget(add_enemy_btn)
        form_widget.setLayout(form_layout)
        self.combat_layout.addWidget(form_widget)

        self.enemy_ship_table = QTableWidget()
        self.enemy_ship_table.setColumnCount(5)
        self.enemy_ship_table.setHorizontalHeaderLabels(['Nome', 'Pontos de Vida', 'Resistência', 'Velocidade', 'Ações'])
        self.combat_layout.addWidget(self.enemy_ship_table)
        self.update_enemy_ship_table()

    def add_enemy_ship(self):
        enemy_ship = {
            'id': len(self.enemy_ships),
            'name': self.enemy_ship_name.text(),
            'maxHp': self.enemy_ship_max_hp.value(),
            'hp': self.enemy_ship_max_hp.value(),
            'hardness': self.enemy_ship_hardness.value(),
            'speed': self.enemy_ship_speed.value()
        }
        self.enemy_ships.append(enemy_ship)
        self.update_enemy_ship_table()
        self.save_data()
        self.enemy_ship_name.clear()
        self.enemy_ship_max_hp.setValue(100)
        self.enemy_ship_hardness.setValue(0)
        self.enemy_ship_speed.setValue(30)

    def update_enemy_ship_table(self):
        self.enemy_ship_table.setRowCount(len(self.enemy_ships))
        for row, ship in enumerate(self.enemy_ships):
            self.enemy_ship_table.setItem(row, 0, QTableWidgetItem(ship['name']))
            self.enemy_ship_table.setItem(row, 1, QTableWidgetItem(f"{ship['hp']}/{ship['maxHp']}"))
            self.enemy_ship_table.setItem(row, 2, QTableWidgetItem(str(ship['hardness'])))
            self.enemy_ship_table.setItem(row, 3, QTableWidgetItem(str(ship['speed'])))
            actions_widget = QWidget()
            actions_layout = QHBoxLayout()
            damage_input = QSpinBox()
            damage_input.setRange(0, 1000)
            damage_btn = QPushButton("Apply Damage")
            damage_btn.clicked.connect(lambda _, r=row: self.apply_enemy_ship_damage(r, damage_input.value()))
            actions_layout.addWidget(damage_input)
            actions_layout.addWidget(damage_btn)
            actions_widget.setLayout(actions_layout)
            self.enemy_ship_table.setCellWidget(row, 4, actions_widget)
        self.enemy_ship_table.resizeColumnsToContents()

    def apply_enemy_ship_damage(self, row, damage):
        ship = self.enemy_ships[row]
        effective_damage = max(0, damage - ship['hardness'])
        ship['hp'] = max(0, ship['hp'] - effective_damage)
        self.update_enemy_ship_table()
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
                    'enemyShips': self.enemy_ships,
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
                self.enemy_ships = data.get('enemyShips', [])
                self.notes = data.get('notes', '')
                self.current_turn = data.get('currentTurn', 0)
                self.update_entity_table()
                self.update_crew_table()
                self.update_enemy_ship_table()
                self.notes_text.setText(self.notes)
                self.ship_name.setText(self.ship['name'])
                self.ship_max_hp.setValue(self.ship['maxHp'])
                self.ship_hp.setValue(self.ship['hp'])
                self.ship_hardness.setValue(self.ship['hardness'])
                self.ship_speed.setValue(self.ship['speed'])
                self.ship_abilities.setText('\n'.join(self.ship['abilities']))
                self.save_data()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = RPGMasterApp()
    window.show()
    sys.exit(app.exec_())