export class UpdateProfileDto {
  /**
   * The user's biography or personal description. This field allows users to provide a brief introduction about themselves, their interests, or any other information they wish to share. It is typically displayed on the user's profile page and can be updated by the user at any time.
   * @example "I'm a bean enthusiast"
   */
  bio: string;
  /**
   * The display name chosen by the user. This is the name that will be shown to other users on the platform and can be different from the user's email or username. The display name is often used to personalize the user's profile and can be updated by the user at any time.
   * @example "BeanLover123"
   */
  displayName: string;
  /**
   * The message of the day (MOTD) is a short message that users can set to share with others when they visit their profile. It can be used to convey a current mood, a quote, or any other brief message the user wants to display. The MOTD is typically shown prominently on the user's profile page and can be updated by the user at any time.
   * @example "Living life one bean at a time!"
   */
  motd: string;
}
