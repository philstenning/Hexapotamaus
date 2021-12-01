import math

def calc_angle_a(_side_a, _side_b, _side_c):
   # cos A = (b2 + c2 - a2) / 2bc
   # use the math.acos function, this is the inverse cosine function
   # it returns radians
    angle_A_radians = math.acos(
        (_side_b**2 + _side_c**2 - _side_a**2) / (2 * _side_b * _side_c))
    # convert to degrees and return
    return int(round(math.degrees(angle_A_radians)))


def calc_angle_c(_side_a, _side_b, _side_c):
    # cos C = (a2 + b2 - c2) / 2ab
    return calc_angle_a(_side_c, _side_b, _side_a)
    # this code is the same as doing it above.
    # angle_A_radians = math.acos(
    #     (_side_a**2 + _side_b**2 - _side_c**2) / (2 * _side_a * _side_b))
    # return math.degrees(angle_A_radians)
