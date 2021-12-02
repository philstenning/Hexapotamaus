import math


def calc_angle_a(side_r, side_s, side_t):
    # cos A = (b2 + c2 - a2) / 2bc
    val = (side_s**2 + side_t**2 - side_r**2) / (2 * side_s * side_t)
    # use the math.acos function, this is the inverse cosine function
    # it returns radians
    angle_A_radians = math.acos(val)
    # convert to degrees and return
    try:
        return int(round(math.degrees(angle_A_radians)))
    except:
        # if the value is out of bounds, return -1
        print("Error: calc_angle_a()", side_r, side_s, side_t)
        return -1


def calc_angle_c(side_r, side_s, side_c):
    # cos C = (a2 + b2 - c2) / 2ab
    return calc_angle_a(side_c, side_s, side_r)
    # this code is the same as doing it above.
    # angle_A_radians = math.acos(
    #     (_side_a**2 + _side_b**2 - _side_c**2) / (2 * _side_a * _side_b))
    # return math.degrees(angle_A_radians)
