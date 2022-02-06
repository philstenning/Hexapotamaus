import json


# LEG_1_OFFSETS = [15, -12, -13]
# LEG_2_OFFSETS = [37, 7, 9]
# LEG_3_OFFSETS = [54, 20, -2]
# LEG_4_OFFSETS = [20, 46, 7]
# LEG_5_OFFSETS = [3, 4, -7]
# LEG_6_OFFSETS = [0, 1, 57] 


def load_settings():
    with open('settings.json', 'r', encoding='utf-8') as settingsFile:
        return json.load(settingsFile)


def save_settings(leg_offsets):
    #! TODO:  need a way to get current settings.
    with open('settings.json', 'w', encoding='utf-8') as settingsFile:
        json.dump({'legOffsets': leg_offsets},
                  settingsFile, ensure_ascii=False)


# def set_settings():
#     leg_offsets[]


# load_settings()
# get_leg_settings()
# print( 'settings --> leg_offsets',leg_offsets)
