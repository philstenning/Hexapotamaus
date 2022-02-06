import math

# The motor arm in a straight line to body of motor
# was set to a value of 500, so 0 degrees is not
# at a value of 0 but around 100.  there will be
# a small difference in how the motor was calibrated
# so you will need to check each motor using the
# ctrl.get_position_offset(motor_id)
MOTOR_OFFSET = 100
MOTOR_DEG = (749)/180  # 4.16111r


# this is the maximum Positions that
# the leg can reach.
# TODO: check this should be 235???
# GRAPH_MAX_Y = 230
# GRAPH_MAX_X = 230

######## leg triangle ########
# this does not include the foot at the moment.
LEG_TRIANGLE_R = 156.62
LEG_TRIANGLE_S = 113.624
LEG_TRIANGLE_T = 193.494  # => math.sqrt(leg_triangle_r**2 + leg_triangle_s**2)

#### POSITION_TRIANGLE ####
# only the side S is known at start
# all others are calculated at runtime
# motor 2 --> motor 3 distance between two
# center pivot points
POSITION_TRIANGLE_S = 70

#  this is the maximum Positions that the leg can reach.
# from the spindle of motor 2 to the end of the leg
MAX_RADIUS = math.floor(POSITION_TRIANGLE_S + LEG_TRIANGLE_T-2) # 261
# Any less than this is not possible as the leg section
# will coliide with the the other leg section.
MIN_RADIUS = 148

# Distance between the center of the motor 1 and the center of the motor 2
MOTOR_1_TO_MOTOR_2_DISTANCE = 40

# Calculate the angle A of the triangle
# see ref for details in main_1.py
# returns angle in degrees
def calc_angle_a(side_r, side_s, side_t):
    # cos A = (b2 + c2 - a2) / 2bc
    val = (side_s**2 + side_t**2 - side_r**2) / (2 * side_s * side_t)
    # use the math.acos function, this is the inverse cosine function
    # it returns radians

    # convert to degrees and return
    try:
        angle_A_radians = math.acos(val)
        return int(round(math.degrees(angle_A_radians)))
    except:
        # if the value is out of bounds, return -1
        if -1.0 > val > 1.0:
            print("Error: out of range -1 to 1 value was:", val)
        else:
            print("Error: calc_angle_a() value was:", val)
        return 90

# Calculate the angle B of the triangle
# see ref for details in main_1.py
# returns angle in degrees
def calc_angle_c(side_r, side_s, side_c):
    # cos C = (a2 + b2 - c2) / 2ab
    return calc_angle_a(side_c, side_s, side_r)

def clamp_motor_3_positions(n):
    print('clamp_motor_3_positions:', n)
    return max(min(MAX_RADIUS, n), MIN_RADIUS)

def calPos(number, motor_deg=4.1611, motor_offset=100):
    return math.floor(motor_deg * number + motor_offset)


def calculate_motor_1_angle(triangle_side_r, triangle_side_s, triangle_side_t):
    # default is 90 degrees
    # if the angle works out to be 0 we return 90
    # prevents division by zero error
    motor_1_angle = 90
    # print('triangle_side_r:', triangle_side_r, ' triangle_side_s:',
    #       triangle_side_s, ' triangle_side_t:', triangle_side_t)
    # clockwise rotation
    if triangle_side_t > 0:
        # print('---> triangle_side_s:', triangle_side_s)

        angle = calc_angle_a(
            triangle_side_r, triangle_side_s, triangle_side_t)
        motor_1_angle = 180 - angle
    # counter clockwise rotation
    elif triangle_side_t < 0:
        # print('<--- triangle_side_s:', triangle_side_s)

        motor_1_angle = calc_angle_a(
            triangle_side_r, triangle_side_s, -triangle_side_t)
        print('res motor_1_angle:', motor_1_angle)
    return motor_1_angle


def calc_angles(foot_position_x, foot_position_y, foot_position_z=0):
    # foot_position_y += GRAPH_MAX_Y
    # if foot_position_y == 0:
    #     foot_position_y = 1

    # calculate motor 1 angle
    motor_1_triangle_s = math.sqrt(foot_position_x**2 + foot_position_z**2)
    motor_1_angle = calculate_motor_1_angle(
        foot_position_x, motor_1_triangle_s, foot_position_z)

    #### base triangle ####
    # this is needed to calculate unknown length of
    # the side in the position triangle / base_triangle_r
    base_triangle_s = foot_position_y  # -GRAPH_MAX_Y
    # was using foot_position_x but now using the hypotenuse of motor_1 triangle.
    #  because when motor 1 rotates it will change the length of the side.
    # but we still need to subtract the the distance from the motor 1 pivot
    # to the motor 2 pivot point.
    base_triangle_t = motor_1_triangle_s - MOTOR_1_TO_MOTOR_2_DISTANCE
    base_triangle_r = math.sqrt(base_triangle_s**2 + base_triangle_t**2)
    # print(base_triangle_r, base_triangle_s, base_triangle_t)

    ######  X Y position triangle ######

    # this is the hypotenuse from the leg triangle.
    position_triangle_r = LEG_TRIANGLE_T

    # calculated from base triangle. check if in range first.
    position_triangle_t = clamp_motor_3_positions(base_triangle_r)

    ####################################
    position_triangle_angle_A = calc_angle_a(
        position_triangle_r, POSITION_TRIANGLE_S,  position_triangle_t)

    position_triangle_angle_C = calc_angle_c(
        position_triangle_r, POSITION_TRIANGLE_S,  position_triangle_t)

    base_triangle_angle_C = calc_angle_c(
        base_triangle_r, base_triangle_s,  base_triangle_t)
    # print(position_triangle_angle_A, position_triangle_angle_C, base_triangle_angle_C)

    motor_2_angle = 180 - (position_triangle_angle_A + base_triangle_angle_C)
    # 36 is the angle of the foot triangle.
    motor_3_angle = 360 - (position_triangle_angle_C + 36 + 90)

    # print(motor_2_angle, motor_3_angle)
    return motor_1_angle,  motor_2_angle, motor_3_angle
